import { useEffect, useState } from 'react';

import useModalStore, { ModalType } from '../store/modalStore';
import useModalCommunication, { mediaQueries, MediaQueryKey, SCRIM_STYLES } from './useModalCommunication';

const useModalInitialization = () => {
  const { sendToParent, handleMessage } = useModalCommunication();
  const modalType = useModalStore((state) => state.modalType);
  const mediaQueryKey = useModalStore((state) => state.mediaQueryKey);
  const [isLoaded, setIsLoaded] = useState(false);
  const isDefaultPosition = useModalStore((state) => state.isDefaultPosition);

  useEffect(() => {
    window.removeEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);
    sendToParent({
      action: 'loaded',
    });
    setIsLoaded(true);
    setScrimStyle(modalType);
  }, []);

  useEffect(
    () => () => {
      window.removeEventListener('message', handleMessage);
    },
    []
  );

  useEffect(() => {
    setIframeStyle(mediaQueryKey, modalType);
    if (isLoaded) {
      setScrimStyle(modalType);
    }
  }, [modalType, mediaQueryKey]);

  const setIframeStyle = (mediaQueryKey: MediaQueryKey, modalType: ModalType) => {
    const style = { ...mediaQueries[mediaQueryKey || 'XL_1024']?.style[modalType] };

    // If modal has been moved AND we are NOT switching to full mode,
    // ignore the right style value so that the modal stays in place
    if (!isDefaultPosition && modalType !== ModalType.Full) {
      delete style.right;
    }
    sendToParent({
      action: 'set-style',
      style,
      modalType,
    });
  };

  const setScrimStyle = (modalType: ModalType) => {
    sendToParent({
      action: 'set-scrim-style',
      style: modalType !== ModalType.Full ? SCRIM_STYLES.NONE : SCRIM_STYLES.FULL,
    });
  };

  return { setIframeStyle };
};

export default useModalInitialization;
