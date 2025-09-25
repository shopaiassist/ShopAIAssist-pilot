import { Helmet } from 'react-helmet-async';

import { useHelmetData } from '../../hooks/script/useHelmetData';

const DEFAULT_SCRIPT_URL = 'https:/main.js';
const DEFAULT_ENVIRONMENT = 'QA';
const BOT_TYPE = 'SHOPAIASSIST';
const TARGET_DIV_ID = 'triva-root';

/**
 * Component that loads the Chatbot used by the Support team for help and user inquiries.
 *
 * This component renders an empty target div, set some state, and then adds a <script/> tag to the page <head/> to load
 * the script that will populate the div and initialize the chatbot.
 *
 * The environment variable TR_KORE_SUPPORT_CHATBOT_URL defines the URL for the script, and
 * the environment variable TR_KORE_SUPPORT_CHATBOT_ENVIRONMENT specifies the environment (e.g. 'QA', 'PROD', etc.).
 */
const SupportChatBot = () => {
  const scriptUrl = process.env.TR_KORE_SUPPORT_CHATBOT_URL || DEFAULT_SCRIPT_URL;
  const environment = process.env.TR_KORE_SUPPORT_CHATBOT_ENVIRONMENT || DEFAULT_ENVIRONMENT;
  // Set a global variable that the script expects to find when it loads.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).chatbotInfo = {
    botType: BOT_TYPE,
    environment,
    autoInit: 'true',
  };
  const helmetData = useHelmetData();
  return (
    <>
      <div id={TARGET_DIV_ID} data-testid={TARGET_DIV_ID} />
      {/* Helmet adds the script tag within literally to the <head> of our document. */}
      <Helmet helmetData={helmetData}>
        <script src={scriptUrl} />
      </Helmet>
    </>
  );
};

export default SupportChatBot;
