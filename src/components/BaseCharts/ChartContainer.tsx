import React from 'react';
import { ParentSize } from '@vx/responsive';
import * as Style from './Charts.style';

const ChartContainer = ({ height }: { height: number }) => {
  return (
    <Style.ChartContainer>
      <ParentSize>
        {({ width }) => <svg width={width} height={height}></svg>}
      </ParentSize>
    </Style.ChartContainer>
  );
};

export default ChartContainer;
