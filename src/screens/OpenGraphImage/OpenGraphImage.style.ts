import styled from 'styled-components';

export const Wrapper = styled.div`
  background-color: black;
  min-height: calc(100vh - 64px);
`;

export const Content = styled.div`
  max-width: 900px;
  margin: auto;
  padding: 1rem 0 3rem;
  color: white;

  @media (max-width: 932px) {
    padding: 1rem;
  }
`;

export const ScreenshotWrapper = styled.div<{ width: number, height: number }>`
  box-sizing: content-box;
  width: ${props => props.width }px;
  height: ${props => props.height }px;
  border: 1px white dotted;
`;

export const ShareCardHolder = styled.div`
  margin: 20px auto;
  width: 400px;
  height: 262px;
`;

export const TitleWrapper = styled.div`
  text-align: center;
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  font-size: 24px;
  font-weight: bold;
  margin-top: 30px;
`;

export const LastUpdatedWrapper = styled.div`
  text-align: center;
  font-family: 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New',
    monospace;
  font-size: 14px;
  margin-top: 9px;
`;