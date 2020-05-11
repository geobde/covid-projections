import React from 'react';
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
import { ProjectionDataset, RT_TRUNCATION_DAYS } from '../../models/Projection';
import { CHART_END_DATE, CASE_GROWTH_RATE, Zones } from '../../enums/zones';
import { formatDecimal, getTruncationDate, last, randomizeId } from './utils';
import * as Style from './Charts.style';

const computeTickPositions = (minY: number, maxY: number, zones: Zones) => {
  const maxZones = zones.MEDIUM.upperLimit;
  const maxTick = maxY < maxZones ? 1.5 * maxZones : maxY;
  return [minY, zones.LOW.upperLimit, zones.MEDIUM.upperLimit, maxTick];
};

// Accessing the data
const x = (d: any) => new Date(d.x);
const yRt = (d: any) => d?.y?.rt;
const yHigh = (d: any) => d?.y?.high;
const yLow = (d: any) => d?.y?.low;

const hasData = (d: any) =>
  !isUndefined(x(d)) &&
  !isUndefined(yRt(d)) &&
  !isUndefined(yLow(d)) &&
  !isUndefined(yHigh(d));

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
  const minDate = d3min(data, x) || new Date('2020-01-01');
  const maxDate = CHART_END_DATE;

  const xScale = scaleTime({
    domain: [minDate, maxDate],
    range: [0, chartWidth],
  });

  const yDataMin = 0;
  const yDataMax = d3max(data, yRt);

  const yScale = scaleLinear({
    domain: [yDataMin, yDataMax],
    range: [chartHeight, 0],
  });

  const xCoord = (d: any) => xScale(x(d));
  const yCoord = (d: any) => yScale(yRt(d));

  const yTicks = computeTickPositions(yDataMin, yDataMax, CASE_GROWTH_RATE);
  const yAxisTicks = _tail(yTicks);

  const { x: lastValidDate } = last(data);
  const dateTruncation = getTruncationDate(lastValidDate, RT_TRUNCATION_DAYS);
  const prevData = data.filter((d: any) => x(d) <= dateTruncation);
  const restData = data.filter((d: any) => x(d) >= dateTruncation);
  const truncationDataPoint = last(prevData);

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
                x={xCoord}
                y0={(d: any) => yScale(yLow(d))}
                y1={(d: any) => yScale(yHigh(d))}
                curve={curveNatural}
              />
            </Style.SeriesArea>
            <Style.SeriesLine>
              <LinePath
                data={prevData}
                x={xCoord}
                y={yCoord}
                curve={curveNatural}
              />
            </Style.SeriesLine>
            <Style.SeriesDashed>
              <LinePath
                data={restData}
                x={xCoord}
                y={yCoord}
                curve={curveNatural}
              />
            </Style.SeriesDashed>
          </Group>
          <Style.LineGrid>
            <GridRows width={chartWidth} scale={yScale} tickValues={yTicks} />
          </Style.LineGrid>
          <Style.TextAnnotation
            x={xScale(x(truncationDataPoint))}
            y={yScale(yRt(truncationDataPoint))}
            textAnchor="middle"
            dy={-20}
          >
            {formatDecimal(yRt(truncationDataPoint))}
          </Style.TextAnnotation>
          <Style.CircleMarker
            cx={xScale(x(truncationDataPoint))}
            cy={yScale(yRt(truncationDataPoint))}
            r={6}
          />
          <Style.Axis>
            <AxisBottom top={chartHeight} scale={xScale} numTicks={7} />
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
        </Group>
      </svg>
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
