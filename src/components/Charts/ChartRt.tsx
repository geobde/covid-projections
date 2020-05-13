import React from 'react';
import moment from 'moment';
import { isUndefined, tail as _tail } from 'lodash';
import { min as d3min, max as d3max } from 'd3-array';
import { Group } from '@vx/group';
import { ParentSize } from '@vx/responsive';
import { scaleLinear, scaleTime } from '@vx/scale';
import { GridRows } from '@vx/grid';
import { curveNatural } from '@vx/curve';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { LinePath, Area } from '@vx/shape';
import { RectClipPath } from '@vx/clip-path';
import { useTooltip } from '@vx/tooltip';
import { localPoint } from '@vx/event';
import { ProjectionDataset, RT_TRUNCATION_DAYS } from '../../models/Projection';
import { CHART_END_DATE, CASE_GROWTH_RATE, Zones } from '../../enums/zones';
import BoxedAnnotation from './BoxedAnnotation';
import HoverOverlay from './HoverOverlay';
import {
  formatDecimal,
  getChartRegions,
  getTruncationDate,
  getZoneByValue,
  last,
  randomizeId,
} from './utils';
import * as Style from './Charts.style';

const computeTickPositions = (minY: number, maxY: number, zones: Zones) => {
  const maxZones = zones.MEDIUM.upperLimit;
  const maxTick = maxY < maxZones ? 1.5 * maxZones : maxY;
  return [minY, zones.LOW.upperLimit, zones.MEDIUM.upperLimit, maxTick];
};

const getDate = (d: any) => new Date(d.x);
const getRt = (d: any) => d?.y?.rt;
const getYAreaHigh = (d: any) => d?.y?.high;
const getYAreaLow = (d: any) => d?.y?.low;

const hasData = (d: any) =>
  !isUndefined(getDate(d)) &&
  !isUndefined(getRt(d)) &&
  !isUndefined(getYAreaLow(d)) &&
  !isUndefined(getYAreaHigh(d));

const ChartRt = ({
  projectionDataset,
  width,
  height = 400,
  marginTop = 5,
  marginBottom = 40,
  marginLeft = 40,
  marginRight = 5,
}: {
  projectionDataset: ProjectionDataset;
  width: number;
  height?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}) => {
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;

  const data = projectionDataset.data.filter(hasData);

  // TODO(@pnavarrc): This is so TS doesn't complain
  const minDate = d3min(data, getDate) || new Date('2020-01-01');
  const maxDate = CHART_END_DATE;

  const xScale = scaleTime({
    domain: [minDate, maxDate],
    range: [0, chartWidth],
  });

  const yDataMin = 0;
  const yDataMax = d3max(data, getRt);

  const yScale = scaleLinear({
    domain: [yDataMin, yDataMax],
    range: [chartHeight, 0],
  });

  const getXCoord = (d: any) => xScale(getDate(d));
  const getYCoord = (d: any) => yScale(getRt(d));

  const yTicks = computeTickPositions(yDataMin, yDataMax, CASE_GROWTH_RATE);
  const yAxisTicks = _tail(yTicks);

  const lastValidDate = getDate(last(data));
  const dateTruncation = getTruncationDate(lastValidDate, RT_TRUNCATION_DAYS);
  const prevData = data.filter((d: any) => getDate(d) <= dateTruncation);
  const restData = data.filter((d: any) => getDate(d) >= dateTruncation);
  const truncationDataPoint = last(prevData);

  const regions = getChartRegions(yDataMin, yDataMax, CASE_GROWTH_RATE);
  const truncationZone = getZoneByValue(
    getRt(truncationDataPoint),
    CASE_GROWTH_RATE,
  );

  const { tooltipData, tooltipOpen, showTooltip, hideTooltip } = useTooltip();
  const onMouseOver = (
    event: React.MouseEvent<SVGPathElement, MouseEvent>,
    d: any,
  ) => {
    // @ts-ignore - typing bug
    const coords = localPoint(event.target.ownerSVGElement, event);
    showTooltip({
      tooltipLeft: coords?.x || 0,
      tooltipTop: coords?.y || 0,
      tooltipData: d,
    });
  };

  const mainClipPathId = randomizeId('chart-clip-path');
  return (
    <Style.ChartContainer>
      <svg width={width} height={height}>
        <Group left={marginLeft} top={marginTop}>
          <RectClipPath
            id={mainClipPathId}
            width={chartWidth}
            height={chartHeight}
          />
          <Group clipPath={`url(#${mainClipPathId})`}>
            <Style.SeriesArea>
              <Area
                data={data}
                x={getXCoord}
                y0={(d: any) => yScale(getYAreaLow(d))}
                y1={(d: any) => yScale(getYAreaHigh(d))}
                curve={curveNatural}
              />
            </Style.SeriesArea>
            {regions.map((region, i) => {
              const clipPathZoneId = randomizeId(`clip-region-${region.name}`);
              const regionHeight = Math.abs(
                yScale(region.valueFrom) - yScale(region.valueTo),
              );
              return (
                <Group key={`chart-region-${i}`}>
                  <RectClipPath
                    id={clipPathZoneId}
                    width={chartWidth}
                    y={yScale(region.valueTo)}
                    height={regionHeight}
                  />
                  <Style.SeriesLine stroke={region.color}>
                    <LinePath
                      data={prevData}
                      x={getXCoord}
                      y={getYCoord}
                      curve={curveNatural}
                      clipPath={`url(#${clipPathZoneId})`}
                    />
                  </Style.SeriesLine>
                  <Style.SeriesDashed stroke={region.color}>
                    <LinePath
                      data={restData}
                      x={getXCoord}
                      y={getYCoord}
                      curve={curveNatural}
                      clipPath={`url(#${clipPathZoneId})`}
                    />
                  </Style.SeriesDashed>
                  <Style.RegionAnnotation
                    color={region.color}
                    isActive={truncationZone.name === region.name}
                  >
                    <BoxedAnnotation
                      x={xScale(CHART_END_DATE) - 10}
                      y={yScale(0.5 * (region.valueFrom + region.valueTo))}
                      text={region.name}
                    />
                  </Style.RegionAnnotation>
                </Group>
              );
            })}
          </Group>
          <Style.LineGrid>
            <GridRows width={chartWidth} scale={yScale} tickValues={yTicks} />
          </Style.LineGrid>
          <Style.TextAnnotation>
            <BoxedAnnotation
              x={xScale(getDate(truncationDataPoint))}
              y={yScale(getRt(truncationDataPoint)) - 30}
              text={formatDecimal(getRt(truncationDataPoint))}
            />
          </Style.TextAnnotation>
          <Style.CircleMarker
            cx={xScale(getDate(truncationDataPoint))}
            cy={yScale(getRt(truncationDataPoint))}
            r={6}
          />
          <Style.Axis>
            <AxisBottom
              top={chartHeight}
              scale={xScale}
              numTicks={Math.round(chartWidth / 100)}
            />
          </Style.Axis>
          <Style.Axis>
            <AxisLeft
              top={marginTop}
              scale={yScale}
              tickValues={yAxisTicks}
              hideAxisLine
              hideTicks
            />
          </Style.Axis>
          <HoverOverlay
            width={chartWidth}
            height={chartHeight}
            data={data}
            x={getXCoord}
            y={getYCoord}
            onMouseOver={onMouseOver}
            onMouseOut={hideTooltip}
          />
          {tooltipOpen && (
            <Style.CircleMarker
              cx={getXCoord(tooltipData)}
              cy={getYCoord(tooltipData)}
              r={6}
              fill={getZoneByValue(getRt(tooltipData), CASE_GROWTH_RATE)?.color}
            />
          )}
        </Group>
      </svg>
      {tooltipOpen && (
        <Style.Tooltip
          left={marginLeft + getXCoord(tooltipData)}
          top={marginTop + getYCoord(tooltipData)}
        >
          <Style.TooltipTitle>
            {moment(getDate(tooltipData)).format('dddd, MMM D, YYYY')}
          </Style.TooltipTitle>
          {`Rt ${formatDecimal(getRt(tooltipData))}`}
        </Style.Tooltip>
      )}
    </Style.ChartContainer>
  );
};

const ChartRtAutosize = ({
  projectionDataset,
  height = 400,
}: {
  projectionDataset: ProjectionDataset;
  height?: number;
}) => (
  <ParentSize>
    {({ width }) => (
      <ChartRt
        width={width}
        height={height}
        projectionDataset={projectionDataset}
      />
    )}
  </ParentSize>
);

export default ChartRtAutosize;
