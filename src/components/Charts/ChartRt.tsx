import React from 'react';
import { isUndefined } from 'lodash';
import { min as d3min } from 'd3-array';
import { Group } from '@vx/group';
import { ParentSize } from '@vx/responsive';
import { scaleTime } from '@vx/scale';
import { AxisBottom } from '@vx/axis';
import { ProjectionDataset } from '../../models/Projection';
import { CHART_END_DATE } from '../../enums/zones';
import * as Style from '../BaseCharts/Charts.style';

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

  return (
    <Style.ChartContainer>
      <svg width={width} height={height}>
        <Group left={marginLeft} top={marginTop}>
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
