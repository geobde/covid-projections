import React from 'react';
import moment from 'moment';
import { isUndefined } from 'lodash';
import { min as d3min, max as d3max } from 'd3-array';
import { Group } from '@vx/group';
import { ParentSize } from '@vx/responsive';
import { scaleLinear, scaleTime } from '@vx/scale';
import { GridRows } from '@vx/grid';
import { curveNatural } from '@vx/curve';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { LinePath, Area } from '@vx/shape';
import { useTooltip } from '@vx/tooltip';
import { localPoint } from '@vx/event';
import { ProjectionDataset, RT_TRUNCATION_DAYS } from '../../models/Projection';
import { CHART_END_DATE, CASE_GROWTH_RATE, Zones } from '../../enums/zones';
import BoxedAnnotation from './BoxedAnnotation';
import HoverOverlay from './HoverOverlay';
import RectClipGroup from './RectClipGroup';
import {
  formatDecimal,
  getChartRegions,
  getTruncationDate,
  getZoneByValue,
  last,
} from './utils';
import * as Style from './Charts.style';

type PointRt = {
  x: number;
  y: {
    rt: number;
    low: number;
    high: number;
  };
};

const computeTickPositions = (minY: number, maxY: number, zones: Zones) => {
  const maxZones = zones.MEDIUM.upperLimit;
  const maxTick = maxY < maxZones ? 1.5 * maxZones : maxY;
  return [minY, zones.LOW.upperLimit, zones.MEDIUM.upperLimit, maxTick];
};

const getDate = (d: PointRt) => new Date(d.x);
const getRt = (d: PointRt) => d?.y?.rt;
const getYAreaHigh = (d: PointRt) => d?.y?.high;
const getYAreaLow = (d: PointRt) => d?.y?.low;

const hasData = (d: any) =>
  !isUndefined(getDate(d)) &&
  !isUndefined(getRt(d)) &&
  !isUndefined(getYAreaLow(d)) &&
  !isUndefined(getYAreaHigh(d));

const getTooltipTitle = (d: PointRt): string =>
  moment(getDate(d)).format('dddd, MMM D, YYYY');

const getTooltipBody = (d: PointRt): string => `Rt ${formatDecimal(getRt(d))}`;

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

  const data: PointRt[] = projectionDataset.data.filter(hasData);

  const minDate = d3min(data, getDate) || new Date('2020-01-01');
  const maxDate = CHART_END_DATE;

  const yDataMin = 0;
  const yDataMax = d3max(data, getRt) || 1;

  const xScale = scaleTime({
    domain: [minDate, maxDate],
    range: [0, chartWidth],
  });

  const yScale = scaleLinear({
    domain: [yDataMin, yDataMax],
    range: [chartHeight, 0],
  });

  const getXCoord = (d: PointRt) => xScale(getDate(d));
  const getYCoord = (d: PointRt) => yScale(getRt(d));

  const yTicks = computeTickPositions(yDataMin, yDataMax, CASE_GROWTH_RATE);
  const regions = getChartRegions(yDataMin, yDataMax, CASE_GROWTH_RATE);

  const lastValidDate = getDate(last(data));

  const dateTruncation = getTruncationDate(lastValidDate, RT_TRUNCATION_DAYS);
  const prevData = data.filter((d: PointRt) => getDate(d) <= dateTruncation);
  const restData = data.filter((d: PointRt) => getDate(d) >= dateTruncation);
  const truncationPoint = last(prevData);
  const truncationRt = getRt(truncationPoint);
  const truncationZone = getZoneByValue(truncationRt, CASE_GROWTH_RATE);

  const { tooltipData, tooltipOpen, showTooltip, hideTooltip } = useTooltip<
    PointRt
  >();

  const onMouseOver = (
    event: React.MouseEvent<SVGPathElement, MouseEvent>,
    d: PointRt,
  ) => {
    // @ts-ignore - typing bug
    const coords = localPoint(event.target.ownerSVGElement, event);
    if (!coords) return;
    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: d,
    });
  };

  return (
    <Style.ChartContainer>
      <svg width={width} height={height}>
        <Group left={marginLeft} top={marginTop}>
          <RectClipGroup width={chartWidth} height={chartHeight}>
            <Style.SeriesArea>
              <Area
                data={data}
                x={getXCoord}
                y0={(d: PointRt) => yScale(getYAreaLow(d))}
                y1={(d: PointRt) => yScale(getYAreaHigh(d))}
                curve={curveNatural}
              />
            </Style.SeriesArea>
            {regions.map((region, i) => (
              <Group key={`chart-region-${i}`}>
                <RectClipGroup
                  y={yScale(region.valueTo)}
                  width={chartWidth}
                  height={yScale(region.valueFrom) - yScale(region.valueTo)}
                >
                  <Style.SeriesLine stroke={region.color}>
                    <LinePath
                      data={prevData}
                      x={getXCoord}
                      y={getYCoord}
                      curve={curveNatural}
                    />
                  </Style.SeriesLine>
                  <Style.SeriesDashed stroke={region.color}>
                    <LinePath
                      data={restData}
                      x={getXCoord}
                      y={getYCoord}
                      curve={curveNatural}
                    />
                  </Style.SeriesDashed>
                </RectClipGroup>
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
            ))}
          </RectClipGroup>
          <Style.LineGrid>
            <GridRows width={chartWidth} scale={yScale} tickValues={yTicks} />
          </Style.LineGrid>
          <Style.TextAnnotation>
            <BoxedAnnotation
              x={xScale(getDate(truncationPoint))}
              y={yScale(getRt(truncationPoint)) - 30}
              text={formatDecimal(getRt(truncationPoint))}
            />
          </Style.TextAnnotation>
          <Style.CircleMarker
            cx={xScale(getDate(truncationPoint))}
            cy={yScale(getRt(truncationPoint))}
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
              tickValues={yTicks}
              hideAxisLine
              hideTicks
              hideZero
            />
          </Style.Axis>
          {tooltipOpen && tooltipData && (
            <Style.CircleMarker
              cx={getXCoord(tooltipData)}
              cy={getYCoord(tooltipData)}
              r={6}
              fill={getZoneByValue(getRt(tooltipData), CASE_GROWTH_RATE).color}
            />
          )}
          <HoverOverlay
            width={chartWidth}
            height={chartHeight}
            data={data}
            x={getXCoord}
            y={getYCoord}
            onMouseOver={onMouseOver}
            onMouseOut={hideTooltip}
          />
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <Style.Tooltip
          left={marginLeft + getXCoord(tooltipData)}
          top={marginTop + getYCoord(tooltipData)}
        >
          <Style.TooltipTitle>
            {getTooltipTitle(tooltipData)}
          </Style.TooltipTitle>
          {getTooltipBody(tooltipData)}
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
