import React, {useState} from 'react';
import { useParams } from 'react-router';
import SocialLocationPreview from 'components/SocialLocationPreview/SocialLocationPreview';
import { ChartType } from 'enums/zones';
import { Projections } from 'models/Projections';
import { useProjections } from 'utils/model';
import { Wrapper, Content, ShareCardHolder, TitleWrapper, LastUpdatedWrapper, ScreenshotWrapper } from './OpenGraphImage.style';
import { formatDate } from 'utils';

/**
 * Screen that just shows the appropriate share card so that we can take a
 * screenshot that we then use as our OpenGraph image.
 */
const OpenGraphImage = () => {
  const { stateId, countyFipsId } = useParams();
  return (
    <Wrapper>
      <Content>
        Facebook
        <ScreenshotWrapper width={600} height={315}>
          <Header />
          <ShareCardHolder>
            <ShareCard stateId={stateId} countyFipsId={countyFipsId} />
          </ShareCardHolder>
        </ScreenshotWrapper>
      </Content>
    </Wrapper>
  );
};


interface ShareCardProps {
  stateId?: string;
  countyFipsId?: string;
}

const Header = () => {
  return (
    <>
      <TitleWrapper>
        Real-time COVID metrics
      </TitleWrapper>
      <LastUpdatedWrapper>
        Updated {formatDate(new Date())}
      </LastUpdatedWrapper>
    </>
  );
}

const ShareCard = ({ stateId, countyFipsId }: ShareCardProps) => {
  if (stateId || countyFipsId) {
    return <LocationShareCard stateId={stateId} countyFipsId={countyFipsId}/>;
  } else {
    return <SocialLocationPreview />;
  }
}

const LocationShareCard = ({ stateId, countyFipsId, }: ShareCardProps) => {
  let projections: Projections | undefined;
  const [countyOption] = useState(countyFipsId && { full_fips_code: countyFipsId });

  projections = useProjections(stateId, countyOption) as any;

  if (!projections) {
    return null;
  }
  const projection = projections.primary;
  const stats = {
    [ChartType.CASE_GROWTH_RATE]: projection.rt,
    [ChartType.HOSPITAL_USAGE]: projection.currentIcuUtilization,
    [ChartType.POSITIVE_TESTS]: projection.currentTestPositiveRate,
  };

  return (
    <SocialLocationPreview projections={projections} stats={stats} />
  )
};

export default OpenGraphImage;
