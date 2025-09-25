import { useEffect, useState } from 'react';

import LOG from '../../services/LoggingService';

interface IArgs {
  /** The URL of the script to load */
  url: string;
}

interface IScript {
  /** Whether the script has failed to load */
  failed: boolean;
  /** Whether the script has been loaded */
  ready: boolean;
}

/**
 * Loads a script dynamically. Used specifically for loading MFEs that use Module federation with Webpack 5.
 * This hook will dynamically load the script by appending a script tag to the head of the document.
 * @param args
 */
const useDynamicScript = (args: IArgs): IScript => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // TODO: we need to optimize here and ensure we do NOT load same script multiple times

  useEffect(() => {
    if (!args.url) {
      return;
    }

    const element = document.createElement('script');

    element.src = args.url;
    element.type = 'text/javascript';
    element.async = true;

    setReady(false);
    setFailed(false);

    element.onload = () => {
      LOG.log(`Dynamic Script Loaded: ${args.url}`);
      setReady(true);
    };

    // REVIEW: At least in some cases, this onerror handler never gets called.  Does it ever?
    element.onerror = () => {
      LOG.error(`Dynamic Script Error: ${args.url}`);
      setReady(false);
      setFailed(true);
    };

    document.head.appendChild(element);

    return () => {
      LOG.log(`Dynamic Script Removed: ${args.url}`);
      document.head.removeChild(element);
    };
  }, [args.url]);

  return {
    ready,
    failed,
  };
};

export default useDynamicScript;
