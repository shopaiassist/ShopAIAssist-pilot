import { useMemo } from 'react';
import { MfeContext, UserAuth } from '@';

import useFetchUser from '../../hooks/useFetchUser';
import LOG from '../../services/LoggingService';
import useNotificationStore from '../../store/notificationStore';
import { SessionData } from '../../store/userSlice';
import { hostTokens } from '../../utils/tokenTypes';
import { SessionStorageKey } from '../useModalCommunication';

const createMfeContext = (
  sessionData: SessionData | null
): (MfeContext & Pick<SessionData, 'bannerAndGuideMetadata'>) | null => {
  LOG.log('creating context for user', sessionData);
  return (
    sessionData && {
      user: sessionData.user,
      permissions: sessionData.permissions,
      bannerAndGuideMetadata: sessionData.bannerAndGuideMetadata,
      locale: 'en-US',
      getAuthToken: async () => {
        if (!sessionData.orchestrationToken && process.env.AUTH_TOKEN) {
          LOG.log(`******* Hacking around the missing orchestration token by using AUTH_TOKEN.`);
          return {
            bearerToken: process.env.AUTH_TOKEN,
          } as UserAuth;
        }
        const oneSourceData = sessionStorage.getItem(SessionStorageKey.OneSourceData);
        const host_product = sessionStorage.getItem('host_product');

        const token = hostTokens.find((v) => v.product === host_product);

        return {
          tokenType: token?.token, // see utils/tokenTypes.ts
          productId: oneSourceData ? encodeURI(oneSourceData) : JSON.stringify({ product_list: [] }),
          bearerToken: sessionData.orchestrationToken,
        } as unknown as UserAuth;
      },
      utilities: {
        fireTelemetryEvent: (eventName: string, eventProperties: { [k: string]: string | number | Date }) => {
          LOG.info(`[olympus] TODO: fireTelemetryEvent(${eventName})`, eventProperties);
        },
        showNotification: (notification) => {
          useNotificationStore.getState().pushNotificationAlert(notification);
        },
      },
    }
  );
};

/** Hook to create memoized MFE context */
const useMemoizedContext = () => {
  const { user } = useFetchUser();
  return useMemo(() => createMfeContext(user), [user]);
};

export default useMemoizedContext;
