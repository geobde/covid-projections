import styled from 'styled-components';

const color = {
  lightGrey: '#eee',
  black: '#000',
  white: '#fff',
};

const charts = {
  fontFamily: "'Source Code Pro', 'Roboto', sans-serif",
  fontWeight: 'bold',
  fontSize: '13px',
  axis: {
    color: '#666',
  },
  annotations: {
    color: '#333',
  },
  series: {
    lineWidth: '4px',
    defaultColor: '#000',
  },
};

const tooltip = {
  bgColor: '#000',
  textColor: '#eee',
  width: '160px',
  boxShadow: '3px 3px 5px #ccc',
  fontSizeTitle: '11px',
};

export const ChartContainer = styled.div`
  position: relative;
  /* TODO(@pnavarrc): This negative margin breaks the auto-size of the chart */
  @media (min-width: 996px) {
    margin-left: -3rem;
  }
`;

export const Axis = styled.g`
  text {
    font-family: ${charts.fontFamily};
    font-weight: ${charts.fontWeight};
    font-size: ${charts.fontSize};
    fill: ${charts.axis.color};
  }
  line {
    stroke: ${charts.axis.color};
  }
`;

export const LineGrid = styled.g`
  line,
  path {
    fill: none;
    stroke: ${color.black};
    stroke-opacity: 0.6;
    stroke-dasharray: 4, 3;
    stroke-width: 1px;
  }
`;

export const SeriesLine = styled.g`
  line,
  path {
    fill: none;
    stroke: ${props =>
      props.stroke ? props.stroke : charts.series.defaultColor};
    stroke-width: ${charts.series.lineWidth};
    stroke-linecap: round;
  }
`;

export const SeriesDashed = styled(SeriesLine)`
  line,
  path {
    stroke-dasharray: 1, 6;
  }
`;

export const SeriesArea = styled.g`
  path {
    fill: ${color.lightGrey};
    stroke: none;
  }
`;

export const CircleMarker = styled.circle`
  stroke: white;
  stroke-width: 2px;
`;

export const TextAnnotation = styled.g`
  rect {
    fill: ${color.white};
    fill-opacity: 1;
    stroke: none;
    rx: 3;
    ry: 3;
  }
  text {
    font-family: ${charts.fontFamily};
    font-weight: ${charts.fontWeight};
    font-size: ${charts.fontSize};
    fill: ${charts.annotations.color};
    text-anchor: middle;
    dominant-baseline: middle;
  }
`;

export const RegionAnnotation = styled(TextAnnotation)<{ isActive: boolean }>`
  rect {
    stroke: ${props => (props.isActive ? props.color : color.lightGrey)};
    stroke-width: 1px;
    fill: ${props => (props.isActive ? props.color : color.white)};
  }
  text {
    fill: ${props => (props.isActive ? color.white : props.color)};
    text-anchor: end;
  }
`;

export const Tooltip = styled.div<{ top: number; left: number }>`
  position: absolute;
  top: ${props => `${props.top}px`};
  left: ${props => `${props.left}px`};
  transform: translate(-50%, calc(-100% - 15px));
  pointer-events: none;
  font-family: ${charts.fontFamily};
  font-weight: ${charts.fontWeight};
  font-size: ${charts.fontSize};
  width: ${tooltip.width};
  color: ${tooltip.textColor};
  background-color: ${tooltip.bgColor};
  box-shadow: ${tooltip.boxShadow};
  padding: 6px;
  border-radius: 3px;
`;

export const TooltipTitle = styled.div`
  font-size: ${tooltip.fontSizeTitle};
`;
