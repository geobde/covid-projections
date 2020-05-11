import styled from 'styled-components';

// TODO(@pnavarrc): Include the fonts in the app
const charts = {
  fontFamily: "'Source Code Pro', 'Roboto', sans-serif",
  fontWeight: 400,
  axis: {
    color: '#666',
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
    fill: ${charts.axis.color};
  }
  line {
    stroke: ${charts.axis.color};
  }
`;
