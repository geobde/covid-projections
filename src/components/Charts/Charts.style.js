import styled from 'styled-components';

const color = {
  lightGrey: '#eee',
  black: '#000',
};

// TODO(@pnavarrc): Include the fonts in the app
const charts = {
  fontFamily: "'Source Code Pro', 'Roboto', sans-serif",
  fontWeight: 400,
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

// Grid
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

// Series
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

// Markers
export const CircleMarker = styled.circle`
  stroke: white;
  stroke-width: 2px;
`;

// Annotations
export const TextAnnotation = styled.text`
  font-family: ${charts.fontFamily};
  font-weight: ${charts.fontWeight};
  font-size: ${charts.fontSize};
  fill: ${charts.annotations.color};
`;
