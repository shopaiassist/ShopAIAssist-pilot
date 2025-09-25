import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FolderItem, TreeItem } from '../@types/sidebar';

export enum ChatDialogState {
  DELETE_CHAT = 'delete',
  UPDATE_CHAT = 'update'
}

/**
 * Represents the state structure managed in the store for modal interactions.
 * This interface includes state management for items that could trigger modal actions,
 * and controls for showing or hiding the modal.
 *
 * @interface ModalState
 * @property {(TreeItem|FolderItem)|undefined} actionItem - The current item (chat or folder) selected for actions like edit/delete.
 * @property {boolean} hideModal - A boolean flag to indicate if the modal should be hidden or shown.
 * @property {ChatDialogState|undefined} modalState - The current state of the modal (e.g., delete, update).
 * @property {Function} setActionItem - Sets the current item for modal actions.
 * @property {Function} setModalState - Sets the current state of the modal.
 * @property {Function} toggleModal - Toggles the modal's visibility state.
 */
export interface ModalState {
  actionItem?: TreeItem | FolderItem;
  modalState?: ChatDialogState;
  hideModal: boolean;
  setActionItem: (newActionItem?: TreeItem | FolderItem) => void;
  setModalState: (newState?: ChatDialogState) => void;
  toggleModal: () => void;
  dismiss: () => void;
}

/**
 * Creates a Zustand store to manage modal state using Zustand along with devtools for debugging.
 * The store contains state and actions related to modal interactions for items such as TreeItem and FolderItem.
 *
 * @returns {UseStore<ModalState>} A Zustand store with the following:
 *         - `actionItem`: The item currently targeted for modal actions.
 *         - `hideModal`: Boolean indicating if the modal is currently shown or hidden.
 *         - `modalState`: The current state of the modal (e.g., delete, update).
 *         - `setActionItem`: Function to set the item to be used in modal actions.
 *         - `setModalState`: Function to set the current state of the modal.
 *         - `toggleModal`: Function to toggle the visibility of the modal.
 */

export const useModalState = create<ModalState>()(
  devtools(
    (set, get) => ({
      actionItem: undefined,
      hideModal: true,
      modalState: undefined,
      setActionItem: (newActionItem?: TreeItem | FolderItem) => {
        set({ actionItem: newActionItem });
      },
      setModalState: (newState?: ChatDialogState) => {
        set({ modalState: newState });
      },
      toggleModal: () => {
        set({ hideModal: !get().hideModal });
      },
      dismiss: () => {
        set({ hideModal: true });
      }
    }),
    { name: 'useModalStore' }
  )
);
