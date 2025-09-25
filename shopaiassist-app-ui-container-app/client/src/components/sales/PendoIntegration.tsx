import { Helmet } from 'react-helmet-async';

import { useInstallPendo } from '../../hooks/sales/usePendoInit';
import { useHelmetData } from '../../hooks/script/useHelmetData';
import { SessionData } from '../../store/userSlice';

/**
 * A component that adds JavaScript integration with Pendo, a 3rd party tool used for displaying trial banners--like
 * "Your trial will expire in 2 days. Click here to Subscribe."--or possibly other guides for introducing new features.
 *
 * The component is integrated by
 * [adding a script snippet to the page](https://dev.azure.com/-DataAndAnalytics/DMSS-PAAE/_wiki/wikis/DMSS-PAAE.wiki/357/Pendo-JavaScript-Agent)
 * and initializing Pendo with a function call.
 */
const PendoIntegration = (props: { context: Pick<SessionData, 'bannerAndGuideMetadata'> }) => {
  const { context } = props;
  const pendoApplicationId = process.env.TR_PENDO_APPLICATION_ID || '';
  const helmetData = useHelmetData();
  const initScript = useInstallPendo(pendoApplicationId);
  return pendoApplicationId ? (
    <>
      {/* Helmet adds the script tag within literally to the <head> of our document. */}
      <Helmet helmetData={helmetData}>
        <script>{initScript}</script>
      </Helmet>
    </>
  ) : null;
};

export default PendoIntegration;
