import React from 'react';
import { useHistory } from 'react-router-dom';
import { GlobalSelector } from 'components/MapSelectors/MapSelectors';

import {
  Wrapper,
  Content,
  Disclaimer,
  SelectorWrapper,
  HeaderSubCopy,
  HighlightColor,
  HeaderTitle,
} from './HomePageHeader.style';

const HomePageHeader = ({
  children,
  locationName,
  countyName = null,
  intervention,
}) => {
  const history = useHistory();

  const handleSelectChange = option => {
    let route = `/state/${option.state_code}`;

    if (option.county_url_name) {
      route = `${route}/county/${option.county_url_name}`;
    }

    history.push(route);

    window.scrollTo(0, 0);
  };

  return (
    <Wrapper>
      <Content>
        <HeaderTitle>
          Act now. <HighlightColor>Save lives.</HighlightColor>
        </HeaderTitle>
        <div>
          <HeaderSubCopy color="inherit" component="p" variant="subtitle2">
<<<<<<< HEAD
            Our projections show when hospitals will likely become overloaded,
            and what you can do to stop COVID.
=======
            Our projections show when hospitals will likely become overloaded
            throughout the country, and what you can do to change the course of
            COVID in your local area.
>>>>>>> 3432a3102e3a8de354535379874724b850056a17
          </HeaderSubCopy>

          <SelectorWrapper>
            <GlobalSelector handleChange={handleSelectChange} />
          </SelectorWrapper>

          {false && (
            <Disclaimer>
              We also make projections for the country as a whole.{' '}
              <a href="http://gooogle.com" rel="noopener noreferrer">
                View our nationwide projections
              </a>
            </Disclaimer>
          )}
        </div>
      </Content>
    </Wrapper>
  );
};

export default HomePageHeader;
