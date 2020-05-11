import React from 'react';
import { ProjectionDataset } from '../../models/Projection';
import { ChartContainer } from '../BaseCharts';

const ChartRt = ({
  projectionDataset,
  height = 400,
}: {
  projectionDataset: ProjectionDataset;
  height?: number;
}) => {
  return <ChartContainer height={height}></ChartContainer>;
};

export default ChartRt;
