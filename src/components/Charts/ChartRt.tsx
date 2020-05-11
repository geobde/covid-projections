import React from 'react';
import moment from 'moment';
import { isUndefined } from 'lodash';
import { min as d3min, max as d3max } from 'd3-array';
import { Group } from '@vx/group';
import { ParentSize } from '@vx/responsive';
import { scaleLinear, scaleTime } from '@vx/scale';
import { AxisBottom } from '@vx/axis';
import { LinePath } from '@vx/shape';
import { ProjectionDataset, RT_TRUNCATION_DAYS } from '../../models/Projection';
import { CHART_END_DATE } from '../../enums/zones';
import * as Style from '../BaseCharts/Charts.style';
import { last } from '../Charts/utils';

const getTruncationDate = (date: Date) =>
  moment(date).subtract(RT_TRUNCATION_DAYS, 'days').toDate();

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

  const data = projectionDataset.data.filter(hasData);

  // TODO(@pnavarrc): This is so TS doesn't complain
  const minDate = d3min(data, x) || new Date('2020-01-01');
  const maxDate = CHART_END_DATE;

  const xScale = scaleTime({
    domain: [minDate, maxDate],
    range: [0, chartWidth],
  });

  const yDataMin = d3min(data, yLow);
  const yDataMax = d3max(data, yHigh);

  const yScale = scaleLinear({
    domain: [yDataMin, yDataMax],
    range: [chartHeight, 0],
  });

  const xCoord = (d: any) => xScale(x(d));
  const yCoord = (d: any) => yScale(yRt(d));

  const { x: lastValidDate } = last(data);
  const truncationData = getTruncationDate(lastValidDate);
  const prevData = data.filter((d: any) => x(d) <= truncationData);
  const restData = data.filter((d: any) => x(d) >= truncationData);

  return (
    <Style.ChartContainer>
      <svg width={width} height={height}>
        <Group left={marginLeft} top={marginTop}>
          <Style.SeriesLine>
            <LinePath data={prevData} x={xCoord} y={yCoord} />
          </Style.SeriesLine>
          <Style.SeriesLineDashed>
            <LinePath data={restData} x={xCoord} y={yCoord} />
          </Style.SeriesLineDashed>
          <Style.Axis>
            <AxisBottom top={chartHeight} scale={xScale} />
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
