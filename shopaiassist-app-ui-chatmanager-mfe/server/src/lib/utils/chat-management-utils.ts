import { ChatAndFolderList, TreeItem, FolderItem } from '../shared/chat-management-types';

/**
 * Sorts a mixed list of folders and chats by their creation date in descending order.
 * @param {ChatAndFolderList} segregatedItems - The list containing both chat and folder items.
 * @returns {ChatAndFolderList} A new list sorted by the creation date of each item.
 */
export const sortFoldersAndMembersByDate = (segregatedItems: ChatAndFolderList): ChatAndFolderList => {
  return segregatedItems.sort((a, b) => {
    // Sort by descending date
    if (a.createdAt < b.createdAt) {
      return 1;
    } else if (a.createdAt > b.createdAt) {
      return -1;
    }
    return 0;
  });
};

/**
 * Sorts a mixed list of folders and chats by their name or nickname.
 * For folders, if a nickname is present, it is used for the sort comparison; otherwise, the folder's name is used.
 * @param {ChatAndFolderList} segregatedItems - The list containing both chat and folder items.
 * @returns {ChatAndFolderList} A new list sorted by the name or nickname of each item.
 */
export const sortFoldersAndMembersByName = (segregatedItems: ChatAndFolderList): ChatAndFolderList => {
  const getNameFromFolderOrMember = (item: TreeItem | FolderItem): string => {
    // Determine the name used for sorting based on item type
    if (item.type === 'folder') {
      const folderItem: FolderItem = item;
      return folderItem.name;
    } else {
      return item.name;
    }
  };

  // Sort items by name or nickname in ascending order
  return segregatedItems.sort((a, b) => {
    const nameA = getNameFromFolderOrMember(a);
    const nameB = getNameFromFolderOrMember(b);
    if (nameA.toLowerreact() < nameB.toLowerreact()) {
      return -1;
    } else if (nameA.toLowerreact() > nameB.toLowerreact()) {
      return 1;
    }
    return 0;
  });
};
