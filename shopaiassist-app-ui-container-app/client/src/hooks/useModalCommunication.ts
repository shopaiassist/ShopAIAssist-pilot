import { useEffect, useRef } from 'react';
import { unwrapResult } from '@reduxjs/toolkit';

import LOG from '../services/LoggingService';
import feedbackStore from '../store/feedbackStore';
import useModalStore, { ModalType } from '../store/modalStore';
import { fetchAuthenticatedUser, setUser } from '../store/userSlice';
import { do_check } from '../utils/valid_domains';
import { useInitPendo } from './sales/usePendoInit';
import { useAppDispatch } from './redux';

export const SessionStorageKey = {
  OneSourceData: 'onesource-data',
  CurrentProduct: 'current-product',
};

type PostMessageAction =
  | 'set-style'
  | 'close'
  | 'media-query-change'
  | 'onesource-data'
  | 'current-product'
  | 'loaded'
  | 'pendo-track'
  | 'click-outside-iframe'
  | 'set-scrim-style'
  | 'move-iframe';

type PostMessageData = {
  action: PostMessageAction;
  style?: Record<string, string | number>;
  pendoEvent?: PendoEvent;
  moveModalData?: {
    horizontal?: number;
    vertical?: number;
    moveMaxLeft?: boolean;
    moveMaxRight?: boolean;
  };
  modalType?: ModalType;
};

export type PendoEvent = {
  name: string;
  data: unknown;
};

export type MediaQueryKey = 'XS_320' | 'S_768' | 'XL_1024' | 'XL_1440' | 'XL_1920';

type MediaQueryValue =
  | '(min-width: 320px)'
  | '(min-width: 768px)'
  | '(min-width: 1024px)'
  | '(min-width: 1440px)'
  | '(min-width: 1920px)';

type MediaQuery = {
  query: MediaQueryValue;
  style: {
    minimized: Record<string, string | number>;
    compact: Record<string, string | number>;
    full: Record<string, string | number>;
  };
};

export type ModalPosition = 'left' | 'right' | 'unset' | 'full';

const PLATFORM_HEADER_HEIGHT = '60px';

const DEFAULT_STYLE = {
  FULL: {
    height: `calc(100vh - ${PLATFORM_HEADER_HEIGHT})`,
    top: `${PLATFORM_HEADER_HEIGHT}`,
    left: 0,
    right: 0,
    margin: 'auto',
    'border-radius': '12px 12px 0px 0px',
  },
  COMPACT: {
    height: `calc(100vh - ${PLATFORM_HEADER_HEIGHT})`,
    top: `${PLATFORM_HEADER_HEIGHT}`,
    left: 'auto',
    margin: 'auto',
    'border-radius': '12px 12px 0px 0px',
  },
  MINIMIZED: {
    height: '190px',
    bottom: 0,
    right: '16px',
    top: 'auto',
    left: 'auto',
  },
};

export const SCRIM_STYLES = {
  FULL: {
    background: '#000000',
    opacity: 0.4,
    display: 'block',
  },
  NONE: {
    display: 'none',
  },
};

// TODO: styles for minimized and compact are test values.  Get actual values from designs
export const mediaQueries: Record<MediaQueryKey, MediaQuery> = {
  XS_320: {
    query: '(min-width: 320px)',
    style: {
      minimized: { width: '312px', ...DEFAULT_STYLE.MINIMIZED, right: '24px' },
      compact: { ...DEFAULT_STYLE.COMPACT, width: '380px', right: '24px' },
      full: {
        ...DEFAULT_STYLE.FULL,
        width: '100vw',
      },
    },
  },
  S_768: {
    query: '(min-width: 768px)',
    style: {
      minimized: { width: '312px', ...DEFAULT_STYLE.MINIMIZED, right: '24px' },
      compact: {
        ...DEFAULT_STYLE.COMPACT,
        width: '380px',
        right: '24px',
      },
      full: {
        ...DEFAULT_STYLE.FULL,
        width: 'calc(100vw - 3rem)',
      },
    },
  },
  XL_1024: {
    query: '(min-width: 1024px)',
    style: {
      minimized: { width: '312px', ...DEFAULT_STYLE.MINIMIZED, right: '32px' },
      compact: {
        ...DEFAULT_STYLE.COMPACT,
        width: '393px',
        right: '32px',
      },
      full: {
        ...DEFAULT_STYLE.FULL,
        width: 'calc(100vw - 3rem)',
      },
    },
  },
  XL_1440: {
    query: '(min-width: 1440px)',
    style: {
      minimized: { width: '324px', ...DEFAULT_STYLE.MINIMIZED, right: '32px' },
      compact: {
        ...DEFAULT_STYLE.COMPACT,
        width: '443px',
        right: '32px',
      },
      full: {
        ...DEFAULT_STYLE.FULL,
        width: 'calc(100vw - 4rem)',
      },
    },
  },
  XL_1920: {
    query: '(min-width: 1920px)',
    style: {
      minimized: { width: '434px', ...DEFAULT_STYLE.MINIMIZED, right: '40px' },
      compact: {
        ...DEFAULT_STYLE.COMPACT,
        width: '594px',
        right: '40px',
      },
      full: {
        ...DEFAULT_STYLE.FULL,
        width: 'calc(100vw - 5rem)',
      },
    },
  },
};

const useModalCommunication = () => {
  const modalType = useModalStore((state) => state.modalType);
  const setModalType = useModalStore((state) => state.setModalType);
  const mediaQueryKey = useModalStore((state) => state.mediaQueryKey);
  const setMediaQuery = useModalStore((state) => state.setMediaQueryKey);
  const setModalPosition = useModalStore((state) => state.setModalPosition);
  const modalPosition = useModalStore((state) => state.modalPosition);
  const dispatch = useAppDispatch();
  const { setIsGlobalFeedbackOpen } = feedbackStore();
  const referencedModalType = useRef(modalType);
  const setIsDefaultPosition = useModalStore((state) => state.setIsDefaultPosition);
  const isDefaultPosition = useModalStore((state) => state.isDefaultPosition);

  // update the referencedModalType when modalType changes
  // this is for use within this hook.
  useEffect(() => {
    referencedModalType.current = modalType;
  }, [modalType]);

  // const getPlatformUrl = (): string => {
  //   return process.env.ONESOURCE_PLATFORM_URL || '';
  // };

  const sendToParent = (data: PostMessageData) => {
    console.log('****** origin from session:', sessionStorage.getItem('origin'));
    let origin = sessionStorage.getItem('origin') ?? '*';
    const host_product = sessionStorage.getItem('host_product') ?? '';

    // if localhost and host is onesource, then use localhost:8080 as origin.
    if (origin.includes('localhost') && host_product === 'os') {
      origin = process.env.ONESOURCE_PLATFORM_URL ?? '';
    }

    console.log('** origin:', origin);

    window.parent.postMessage(data, origin);
  };

  const closeCommand = (): void => {
    const isChatting = sessionStorage.getItem('isChatting') === 'true';

    if (isChatting && referencedModalType.current != ModalType.Minimized) {
      setIsGlobalFeedbackOpen(true);
    } else {
      setIsGlobalFeedbackOpen(false);
      handleClose();
    }

    sessionStorage.removeItem('isChatting');
  };

  const handleClose = () => {
    sendToParent({ action: 'close' });
  };

  const handleCompactState = () => {
    setModalType(ModalType.Compact);
    setModalPosition(isDefaultPosition ? 'right' : modalPosition);
    const aiContainerList = document.getElementsByClassName('ai-assistant-container');
    if (aiContainerList && aiContainerList.length > 0) {
      const containerElement = aiContainerList[0] as HTMLElement;
      containerElement.style.width = '100%';
    }
  };

  const handleMinimizedState = () => {
    setModalType(ModalType.Minimized);
    setModalPosition(isDefaultPosition ? 'right' : modalPosition);
  };

  const handleFullState = () => {
    setIsDefaultPosition(true);
    setModalType(ModalType.Full);
    setModalPosition('full');
  };

  const moveMaxLeft = () => {
    sendToParent({
      action: 'move-iframe',
      moveModalData: {
        moveMaxLeft: true,
      },
    });
    setIsDefaultPosition(false);
    setModalPosition('left');
  };

  const moveMaxRight = () => {
    sendToParent({
      action: 'move-iframe',
      moveModalData: {
        moveMaxRight: true,
      },
    });
    setModalPosition('right');
  };

  const handleMessage = (event: MessageEvent) => {
    if (do_check(event.origin)) {
      let host_product = 'os';
      let token = '';

      switch (event.data?.action as PostMessageAction) {
        case 'media-query-change':
          {
            const queryKey = (Object.keys(mediaQueries) as Array<MediaQueryKey>).find(
              (key) => mediaQueries[key].query === (event.data.data as MediaQueryValue)
            );
            setMediaQuery(queryKey || mediaQueryKey);
          }
          break;
        case 'onesource-data':
          /**
           * Sample data for event.data.data:
           * {
           *  user: {
           *    id: 'onesource_user_id'
           *    firstName: 'John',
           *    lastName: 'Doe',
           *    email: 'john@email.com',
           *    userObjectId: 'user_object_id',
           *  },
           *  product_list: ['Workflows', 'Tax Provision', 'Income Tax'],
           *  firmId:'firm_id',
           *  tenantId: 'tenant_id',
           *  token: 'gtm-sdfsdfsdfjsdf'
           * }
           */

          // checks for a onesource-data item called "host_product" in the event.data.data object.
          if (event.data?.data.host_product) {
            host_product = event.data?.data.host_product;
          }

          // checks for a onesource-data item called "token" in the event.data.data object.
          if (event.data?.data.token) {
            token = event.data?.data.token;
          }

          sessionStorage.setItem('token', token);
          sessionStorage.setItem('origin', event.origin);
          sessionStorage.setItem('host_product', host_product);
          sessionStorage.setItem(SessionStorageKey.OneSourceData, JSON.stringify(event.data?.data));
          updateUser();
          initPendo();
          break;
        case 'current-product':
          console.log('Current product:', event.data?.data);
          sessionStorage.setItem(SessionStorageKey.CurrentProduct, JSON.stringify(event.data?.data));
          break;
        case 'close':
          closeCommand();
          console.log('Close event received from parent');
          break;
      }
    }
  };

  const initPendo = () => {
    const pendoApplicationId = process.env.TR_PENDO_APPLICATION_ID || '';
    useInitPendo(pendoApplicationId);
  };

  const updateUser = () => {
    dispatch(fetchAuthenticatedUser())
      .then(unwrapResult)
      .then((user) => {
        if (user) {
          LOG.log('Fetched user:', user);
          dispatch(setUser(user));
        } else {
          LOG.log('No fetched user. Redirecting to login');
        }
      })
      .catch((err) => {
        LOG.error('Failed to fetch user:', err);
      });
  };

  const trackPendo = (pendoEvent: PendoEvent) => {
    sendToParent({ action: 'pendo-track', pendoEvent });
  };

  return {
    handleClose,
    handleCompactState,
    handleMinimizedState,
    handleFullState,
    handleMessage,
    sendToParent,
    modalType,
    mediaQueryKey,
    trackPendo,
    moveMaxLeft,
    moveMaxRight,
  };
};

export default useModalCommunication;
