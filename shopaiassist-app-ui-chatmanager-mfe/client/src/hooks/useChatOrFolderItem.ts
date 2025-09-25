import { Dispatch, SetStateAction, useState } from 'react';
import { ChatDialogState, useModalState } from '../store/useModalStore';
import { useMatterActionsStore, MatterDialogState } from '../store/useMatterActionsStore';
import { ITEM_TYPE, useChatSidebarStore } from '../store/useChatSidebarStore';
import { ItemType } from '../@types/sidebar';
import useMFECommunication from './useMFECommunication';

/**
 * Enum for different modes of display options
 */
enum OptionsModes {
  ARCHIVED_MODE = 'archive_mode',
  NOT_ARCHIVED_MODE = 'not_archive_mode'
}

/**
 * Item options type
 */
type ItemOption = {
  name: string;
  icon: string;
  onShow: OptionsModes[];
  action: () => void;
};

/**
 * Custom hook for managing the visibility state and popper menu reference of a chat or folder item menu.
 * This hook provides an interface for toggling the menu's visibility and managing a reference to the popper menu,
 * which can be useful for positioning floating UI elements.
 *
 * @param {boolean} menuStateInitialValue - The initial visibility state of the menu (true for visible, false for hidden).
 * @param {string} itemId - The identifier of the chat or folder item.
 * @param {ItemType} itemType - The type of the item (either 'chat' or 'folder').
 * @returns {[
 *   boolean,
 *   () => void,
 *   null | HTMLElement,
 *   Dispatch<SetStateAction<null | HTMLElement>>,
 *   { name: string; icon: string; action: () => void; }[]
 * ]} A tuple containing:
 *   - {boolean} chatOrFolderItemMenuState: The current visibility state of the menu.
 *   - {() => void} toggleChatOrFolderItemMenu: Function to toggle the menu's state.
 *   - {null | HTMLElement} popperMenuReference: The current reference used for the popper menu, initially `null`.
 *   - {Dispatch<SetStateAction<null | HTMLElement>>} setPopperMenuReference: Function to set the reference for the popper menu.
 *   - {{ name: string; icon: string; action: () => void; }[]} menuOptions: The menu options available for the item.
 *
 * @example
 * // Usage within a component
 * const [menuVisible, toggleMenu, popperRef, setPopperRef, menuOptions] = useChatOrFolderItem(false, 'item-id', 'chat');
 *
 * // Toggle menu on button click
 * <button onClick={toggleMenu}>
 *   {menuVisible ? 'Hide Menu' : 'Show Menu'}
 * </button>
 *
 * // Setting a ref obtained from a popper library
 * setPopperRef(popperInstance.reference);
 */
export const useChatOrFolderItem = (
  menuStateInitialValue: boolean,
  itemId: string,
  itemType: ItemType
): [
    boolean,
    () => void,
    HTMLElement | null,
    Dispatch<SetStateAction<HTMLElement | null>>,
    {
      name: string;
      icon: string;
      action: () => void;
    }[]
  ] => {
  const [chatOrFolderItemMenuState, setChatOrFolderItemMenuState] = useState(menuStateInitialValue);
  const [popperMenuReference, setPopperMenuReference] = useState<HTMLElement | null>(null);
  const [chatsAndFolders] = useChatSidebarStore((state) => [state.chatsAndFolders]);
  const [setActionItem, toggleModal, setModalState] = useModalState((state) => [
    state.setActionItem,
    state.toggleModal,
    state.setModalState
  ]);
  const treeItem = Array.isArray(chatsAndFolders) 
    ? chatsAndFolders.find((item) => item.treeItemId === itemId)
    : undefined;
  const [toggleMatterDialog, unarchiveFolder] = useMatterActionsStore((state) => [
    state.toggleMatterDialog,
    state.unarchiveFolder
  ]);
  const [archivedMattersView] = useChatSidebarStore((state) => [state.archivedMattersView]);

  const [sendEvent] = useMFECommunication('chat_export');

  const menuOptions: ItemOption[] =
    itemType === ITEM_TYPE.CHAT
      ? [
        {
          name: 'EXPORT_PDF',
          icon: 'file-export',
          onShow: [OptionsModes.NOT_ARCHIVED_MODE],
          action: () => {
            if (treeItem) {
              sendEvent({ message: 'chat_export', body: { treeItem, exportType: 'pdf' } });
            }
            popperMenuReference?.click();
          }
        },
        {
          name: 'EXPORT_TXT',
          icon: 'file-export',
          onShow: [OptionsModes.NOT_ARCHIVED_MODE],
          action: () => {
            if (treeItem) {
              sendEvent({ message: 'chat_export', body: { treeItem, exportType: 'txt' } });
            }
            popperMenuReference?.click();
          }
        },
        {
          name: 'EDIT_CHAT',
          icon: 'pen-line',
          onShow: [OptionsModes.NOT_ARCHIVED_MODE],
          action: () => {
            setActionItem(treeItem);
            setModalState(ChatDialogState.UPDATE_CHAT);
            toggleModal();
            toggleChatOrFolderItemMenu();
            popperMenuReference?.click();
          }
        }
        /**
         * Removing the Move chat action from the chat menu options until we implement the flow for moving
         * chats between matters
         */
        /*{ name: 'MOVE_CHAT', icon: 'arrow-right-from-line', action: () => {} },*/
        // {
        //   name: 'DELETE_CHAT',
        //   icon: 'trash-can',
        //   onShow: [OptionsModes.ARCHIVED_MODE, OptionsModes.NOT_ARCHIVED_MODE],
        //   action: () => {
        //     setActionItem(treeItem);
        //     setModalState(ChatDialogState.DELETE_CHAT);
        //     toggleModal();
        //     toggleChatOrFolderItemMenu();
        //   }
        // }
      ]
      : [
        {
          name: 'EDIT_FOLDER',
          icon: 'pen-line',
          onShow: [OptionsModes.NOT_ARCHIVED_MODE],
          action: () => {
            toggleMatterDialog(MatterDialogState.UPDATE_MATTER, treeItem);
            toggleChatOrFolderItemMenu();
          }
        },
        {
          name: 'ARCHIVE_FOLDER',
          icon: 'box-archive',
          onShow: [OptionsModes.NOT_ARCHIVED_MODE],
          action: () => {
            toggleMatterDialog(MatterDialogState.ARCHIVE_MATTER, treeItem);
            toggleChatOrFolderItemMenu();
          }
        },
        {
          name: 'UNARCHIVE_FOLDER',
          onShow: [OptionsModes.ARCHIVED_MODE],
          icon: 'box-archive',
          action: () => {
            unarchiveFolder(treeItem?.treeItemId);
          }
        },
        {
          name: 'DELETE_MATTER',
          icon: 'trash-can',
          onShow: [OptionsModes.ARCHIVED_MODE, OptionsModes.NOT_ARCHIVED_MODE],
          action: () => {
            toggleMatterDialog(MatterDialogState.DELETE_MATTER, treeItem);
            toggleChatOrFolderItemMenu();
          }
        }
      ];

  /**
   * Toggles the open/close state of the chat or folder item menu.
   * By calling this function, the current boolean state of the menu's visibility is flipped.
   * If the menu is currently open (true), it will be set to closed (false), and vice versa.
   */
  const toggleChatOrFolderItemMenu = () => {
    setChatOrFolderItemMenuState(!chatOrFolderItemMenuState);
  };

  return [
    chatOrFolderItemMenuState,
    toggleChatOrFolderItemMenu,
    popperMenuReference,
    setPopperMenuReference,
    menuOptions.filter((chatMenuOption: ItemOption) =>
      archivedMattersView
        ? chatMenuOption.onShow.includes(OptionsModes.ARCHIVED_MODE)
        : chatMenuOption.onShow.includes(OptionsModes.NOT_ARCHIVED_MODE)
    )
  ];
};
