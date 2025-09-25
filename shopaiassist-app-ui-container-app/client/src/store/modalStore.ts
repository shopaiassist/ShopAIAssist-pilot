import { create } from 'zustand';

import { MediaQueryKey, ModalPosition } from '../hooks/useModalCommunication';

export enum ModalType {
  Minimized = 'minimized',
  Compact = 'compact',
  Full = 'full',
}

interface ModalState {
  modalType: ModalType;
  setModalType: (type: ModalType) => void;
  mediaQueryKey: MediaQueryKey;
  setMediaQueryKey: (query: MediaQueryKey) => void;
  isDefaultPosition: boolean;
  setIsDefaultPosition: (isDefaultPosition: boolean) => void;
  modalPosition: ModalPosition;
  setModalPosition: (position: ModalPosition) => void;
}
const useModalStore = create<ModalState>((set) => ({
  modalType: ModalType.Full,
  setModalType: (type: ModalType) => set(() => ({ modalType: type })),
  mediaQueryKey: 'XL_1440',
  setMediaQueryKey: (query: MediaQueryKey) => set(() => ({ mediaQueryKey: query })),
  isDefaultPosition: true,
  setIsDefaultPosition: (isDefaultPosition: boolean) => set(() => ({ isDefaultPosition })),
  modalPosition: 'full',
  setModalPosition: (modalPosition: ModalPosition) => set(() => ({ modalPosition })),
}));

export default useModalStore;
