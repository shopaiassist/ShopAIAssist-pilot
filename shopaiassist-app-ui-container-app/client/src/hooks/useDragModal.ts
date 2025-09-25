import { useEffect, useState } from 'react';
import throttle from 'lodash/throttle';

import useModalStore, { ModalType } from '../store/modalStore';
import useModalCommunication from './useModalCommunication';

/**
 * Custom hook to manage the drag functionality of the modal
 */
const useDragModal = () => {
  const { modalType, sendToParent } = useModalCommunication();
  const setIsDefaultPosition = useModalStore((state) => state.setIsDefaultPosition);
  const modalPosition = useModalStore((state) => state.modalPosition);
  const setModalPosition = useModalStore((state) => state.setModalPosition);
  let initialPageX = 0;
  let totalHorizontalMovement = 0;

  useEffect(() => {
    if (modalType !== ModalType.Full) {
      document.getElementById('saf-product-header')?.removeEventListener('mousedown', onMouseDown);
      document.getElementById('saf-product-header')?.addEventListener('mousedown', onMouseDown);
    }
  }, [modalType]);

  useEffect(
    () => () => {
      document.getElementById('saf-product-header')?.removeEventListener('mousedown', onMouseDown);
    },
    [modalType]
  );

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    if ((e.target as HTMLElement)?.tagName !== 'SAF-BUTTON') {
      totalHorizontalMovement = 0;
      initialPageX = e.pageX;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onMouseMove = throttle((e) => {
    e.preventDefault();
    const diff = e.pageX - initialPageX;
    totalHorizontalMovement += diff;
    sendToParent({
      action: 'move-iframe',
      moveModalData: {
        horizontal: diff,
        vertical: 0, // In case we want to add vertical movement in the future
        moveMaxLeft: false,
        moveMaxRight: false,
      },
    });
  }, 5);

  const onMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    setIsDefaultPosition(false);
    if (modalPosition !== 'unset' && Math.abs(totalHorizontalMovement) > 0) {
      setModalPosition('unset');
    }
  };
};

export default useDragModal;
