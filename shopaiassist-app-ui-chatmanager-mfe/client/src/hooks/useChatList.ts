import { useEffect, useState } from 'react';
import { SortedChatsAndFolders, sortFoldersAndChats } from '../utils/folders';
import { TreeItem, FolderItem } from '../@types/sidebar';
import { SortOptions, useChatSidebarStore } from '../store/useChatSidebarStore';

/**
 * Custom hook for managing and sorting a list of chat or folder items.
 * This hook also handles the selection state of items in the list.
 *
 * @param {Array<TreeItem | FolderItem>} [chatsAndFolders] - An array of chats and folders to be sorted and managed.
 * @returns {[SortedChatsAndFolders[] | undefined, (TreeItem | FolderItem) | undefined, (newItem: (TreeItem | FolderItem) | undefined) => void]} A tuple containing:
 *          - {SortedChatsAndFolders[] | undefined} sortedChatsAndFolders: The sorted array of chats and folders.
 *          - {(TreeItem | FolderItem) | undefined} activeItem: The currently active item.
 *          - {(newItem: (TreeItem | FolderItem) | undefined) => void} updateActiveItem: Function to update the currently active item.
 *
 * @example
 * const [sortedItems, activeItem, setActiveItem] = useChatList(chatFoldersArray);
 */
export const useChatList = (
  chatsAndFolders?: Array<TreeItem | FolderItem>
): [
  SortedChatsAndFolders[] | undefined,
  (TreeItem | FolderItem) | undefined,
  (newItem: (TreeItem | FolderItem) | undefined) => void
] => {
  const [activeItem, setActiveItem] = useState<(TreeItem | FolderItem) | undefined>();
  const [sortedChatsAndFolders, setSortedChats] = useState<SortedChatsAndFolders[]>();
  const [activeChat, setActiveFolder, setActiveChat, setSortType] = useChatSidebarStore((state) => [
    state.activeChat,
    state.setActiveFolder,
    state.setActiveChat,
    state.setSortType
  ]);

  useEffect(() => {
    setSortedChats(sortFoldersAndChats(chatsAndFolders || []));
    if (activeItem) {
      if (!chatsAndFolders?.some((item) => item.treeItemId === activeItem.treeItemId)) {
        updateActiveItem(undefined);
      }
    }
  }, [chatsAndFolders]);

  useEffect(() => {
    if (!activeChat) {
      setActiveItem(undefined);
    } else if (!activeItem && activeChat) {
      setActiveItem(activeChat);
    }
  }, [activeChat]);

  /**
   * Updates the currently active item in the list.
   * @param {(TreeItem | FolderItem) | undefined} newItem - The new item to be set as active.
   */
  const updateActiveItem = (newItem?: TreeItem | FolderItem) => {
    setActiveItem(newItem);
    if (newItem && newItem.type === 'folder') {
      setSortType(SortOptions.BY_DATE);
      setActiveChat();
      setActiveFolder(newItem);
    } else {
      setActiveChat(newItem);
    }
  };

  return [sortedChatsAndFolders, activeItem, updateActiveItem];
};
