import styled from 'styled-components';

const color = {
  lightGrey: '#eee',
};

// TODO(@pnavarrc): Include the fonts in the app
const charts = {
  fontFamily: "'Source Code Pro', 'Roboto', sans-serif",
  fontWeight: 400,
  fontSize: '13px',
  axis: {
    color: '#666',
  },
  series: {
    lineWidth: '4px',
    defaultColor: '#000',
  },
};

export const ChartContainer = styled.div`
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

export const SeriesLine = styled.g`
  line,
  path {
    fill: none;
    stroke: ${charts.series.defaultColor};
    stroke-width: ${charts.series.lineWidth};
    stroke-linecap: round;
  }
`;

export const SeriesLineDashed = styled(SeriesLine)`
  line,
  path {
    stroke-dasharray: 1, 6;
  }
`;

export const AreaConfidenceInterval = styled.g`
  path {
    fill: ${color.lightGrey};
    stroke: none;
  }
`;

// Markers
export const CircleMarker = styled.circle`
  stroke: white;
  stroke-width: 2px;
`;
