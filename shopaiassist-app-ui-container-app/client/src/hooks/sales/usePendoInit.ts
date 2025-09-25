import { useEffect } from 'react';
import { getIdStitchValues } from '@/-id-stitch';

import LOG from '../../services/LoggingService';

declare global {
  interface Window {
    pendo: Pendo;
  }
}

interface Pendo {
  initialize: (options: PendoInitializationObject) => void;
}

type PendoSessionInfo = {
  timestamp: number;
  visitorId: string;
  accountId: string;
};

const getCookie = (name: string): string => {
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');

  if (parts.length == 2) {
    return parts.pop()?.split(';').shift() || '';
  } else {
    return '';
  }
};

export type PendoEvent = {
  name: string;
  data: PendoEventData;
};

export type PendoEventData = {
  date: string;
  application: string; // This will be set by Platform UI
  searchQueryNumber: string; // Question Text
  searchQueryInput: string; // e.g. question 1, question 2, etc
  conversationId: string;
  conversationEntryId: string; // ID of each question/answer pair
  summaryResponse: string; // AI answer
  webSessionId: string;
};

export type PendoInitializationObject = {
  visitor: {
    id: string;
    onesource_language: string;
    adobeEcid?: string;
    emailHash?: string;
  };
  account: {
    id: string;
    environment: string;
    account_type?: string;
  };
};

/** A hook for initializing Pendo, a 3rd party tool used for displaying trial banners and guides. */
export const useInstallPendo = (pendoApplicationId: string) => {
  return getPendoInitScript(pendoApplicationId);
};

export const useInitPendo = (pendoApplicationId: string): void => {
  (async () => {
    if (pendoApplicationId) {
      LOG.info(`Installing banner and guide system.`);
      const pendo = await waitForPendoGlobal();
      if (pendo) {
        initializePendo(pendo);
        LOG.info(`Pendo installed.`);
      } else {
        LOG.error(`Could not install Pendo. No 'pendo' global defined.`);
      }
    } else {
      LOG.warn(`Could not install pendo. No TR_PENDO_APPLICATION_ID value defined.`);
    }
  })().catch((err) => LOG.error(`Error installing pendo:`, err));
};

const getPendoInitScript = (pendoApplicationId: string) => {
  return `(function (apiKey) {
        (function (p, e, n, d, o) {
          var v, w, x, y, z;
          o = p[d] = p[d] || {};
          o._q = [];
          v = ['initialize', 'identify', 'updateOptions', 'pageLoad', 'track'];
          for (w = 0, x = v.length; w < x; ++w)
            (function (m) {
              o[m] =
                o[m] ||
                function () {
                  o._q[m === v[0] ? 'unshift' : 'push']([m].concat([].slice.call(arguments, 0)));
                };
            })(v[w]);
          y = e.createElement(n);
          y.async = !0;
          y.src = 'https://content-5916201753116672.analytics.example.com/agent/static/' + apiKey + '/pendo.js';
          z = e.getElementsByTagName(n)[0];
          z.parentNode.insertBefore(y, z);
        })(window, document, 'script', 'pendo');
      })('${pendoApplicationId}');`;
};

export const initializePendo = async (pendo: Pendo) => {
  let idStitchValues = null;
  let pendoSessionInfo: PendoSessionInfo = { timestamp: 0, visitorId: '', accountId: '' };
  let pendoInitializationObject: PendoInitializationObject = {
    visitor: {
      id: '',
      onesource_language: '',
    },
    account: {
      id: '',
      environment: '',
    },
  };
  let onesourceSessionObj;

  try {
    onesourceSessionObj = JSON.parse(sessionStorage.getItem('onesource-data') ?? '{}');
    const pendoString = sessionStorage.getItem('pendo_sessionLastUserInteractionEvent');
    pendoSessionInfo = JSON.parse(pendoString || '');
    idStitchValues = await getIdStitchValues(onesourceSessionObj.user.email);
  } catch (e) {
    console.error('Error retrieving Adobe ID stitch values');
  } finally {
    if (pendoSessionInfo) {
      pendoInitializationObject = {
        visitor: {
          id: pendoSessionInfo.visitorId,
          onesource_language: getCookie('LSLanguage'),
        },
        account: {
          id: pendoSessionInfo.accountId,
          environment: process.env.PLATFORM_ENV || '',
          ...(onesourceSessionObj?.accountType && { account_type: onesourceSessionObj?.accountType }),
        },
      };
      if (idStitchValues) {
        pendoInitializationObject.visitor.adobeEcid = idStitchValues.adobeEcid;
        pendoInitializationObject.visitor.emailHash = idStitchValues.emailHash;
      }
    }
  }

  try {
    pendo.initialize(pendoInitializationObject);
  } catch (e) {
    console.error('Error initializing Pendo');
  }
};

const RETRIES = 20;
const WAIT_INTERVAL_IN_MS = 100;

/** Returns the `pendo` global object once it exists. */
const waitForPendoGlobal = async (): Promise<Pendo> => {
  let pendo: Pendo;
  // The script our component renders into <head> will define the global `pendo` object, but it does so asynchronously,
  // so on first render we have to yield before the object will exist. So we'll sleep 1ms at first and then a longer
  // increment after that, for some number of retries, returning when it appears or throwing an error if it times out.
  let intervalMs = 1;
  for (let i = 0; i < RETRIES; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pendo = (window as any).pendo;
    if (pendo) {
      return pendo;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    intervalMs = WAIT_INTERVAL_IN_MS;
  }
  throw new Error(`Could not find 'pendo' global after ${RETRIES} retries.`);
};
