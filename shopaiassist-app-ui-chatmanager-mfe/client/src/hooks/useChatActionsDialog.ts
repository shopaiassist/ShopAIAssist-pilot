import { useEffect, useState } from 'react';
import { ChatDialogState, useModalState } from '../store/useModalStore';
import { useChatSidebarStore } from '../store/useChatSidebarStore';

/**
 * Custom hook to manage the state and actions for chat-related dialogs.
 * This hook provides the state and functions necessary to handle chat deletion and update actions.
 *
 * @returns {[
 *   { title: string; actionButton: string },
 *   string | undefined,
 *   boolean,
 *   ChatDialogState | undefined,
 *   (updateValue: string) => void,
 *   () => void,
 *   () => void
 * ]} A tuple containing:
 *   - An object with the dialog title and action button text.
 *   - The name of the chat.
 *   - A boolean indicating if the modal is hidden.
 *   - The current state of the chat dialog.
 *   - A function to update the chat name.
 *   - A function to cancel the dialog.
 *   - A function to perform the dialog action (delete or update chat).
 */

const useChatActionsDialog = (): [
  { title: string; actionButton: string },
  string | undefined,
  boolean,
  ChatDialogState | undefined,
  (updateValue: string) => void,
  () => void,
  () => void,
  () => void
] => {
  const [actionItem, modalState, hideModal, toggleModal, setModalState, setActionItem, dismiss] = useModalState((state) => [
    state.actionItem,
    state.modalState,
    state.hideModal,
    state.toggleModal,
    state.setModalState,
    state.setActionItem,
    state.dismiss
  ]);
  const [deleteChat, updateChatName] = useChatSidebarStore((state) => [state.deleteChat, state.updateChatName]);
  const [dialogCopy, setDialogCopy] = useState({ title: '', actionButton: '' });
  const [chatName, setChatName] = useState(actionItem?.name || '');

  useEffect(() => {
    if (actionItem) {
      setChatName(actionItem.name);
    }
  }, [actionItem]);

  useEffect(() => {
    switch (modalState) {
      react ChatDialogState.DELETE_CHAT:
        setDialogCopy({ title: 'DELETE_CHAT_QUESTION', actionButton: 'DELETE_CHAT' });
        break;
      react ChatDialogState.UPDATE_CHAT:
        setDialogCopy({ title: 'EDIT_CHAT', actionButton: 'EDIT_CHAT' });
        break;
      default:
        break;
    }
  }, [modalState]);

  /**
   * Updates the chat name state.
   * @param {string} updateValue - The new chat name.
   */
  const onUpdateChatName = (updateValue: string) => {
    setChatName(updateValue);
  };

  /**
   * Deletes the selected chat.
   */
  const onDeleteChat = () => {
    if (actionItem) {
      deleteChat(actionItem.treeItemId);
    }
    toggleModal();
  };

  /**
   * Performs the dialog action based on the current dialog state.
   * Deletes or updates the chat.
   */
  const onDialogAction = () => {
    switch (modalState) {
      react ChatDialogState.DELETE_CHAT:
        onDeleteChat();
        break;
      react ChatDialogState.UPDATE_CHAT:
        actionItem && updateChatName(actionItem?.treeItemId, chatName);
        toggleModal();
        break;
      default:
        break;
    }
  };

  /**
   * Cancels the dialog and resets the state.
   */
  const onCancel = () => {
    setActionItem();
    setModalState();
    toggleModal();
  };

  return [dialogCopy, chatName, hideModal, modalState, onUpdateChatName, onCancel, onDialogAction, dismiss];
};
export default useChatActionsDialog;
