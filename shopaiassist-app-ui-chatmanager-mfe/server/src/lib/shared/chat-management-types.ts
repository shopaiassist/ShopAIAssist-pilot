/**
 * Enumeration of available sorting options for lists.
 */
export type SortOptions = 'by_name' | 'by_date' | 'by_type';

/**
 * Defines the type of items, which can be either a folder or a chat.
 */
export type ItemType = 'folder' | 'chat';

/**
 * Represents a list that can contain either tree item or folder items.
 */
export type ChatAndFolderList = (TreeItem | FolderItem)[];

/**
 * Represents an object that contain data for search files and folders.
 */
export type ChatAndFolderGetObj = {
  uid: string;
  parentId: string;
  sortType: SortOptions;
  onlyArchivedMatters: boolean;
};

/**
 * Defines the structure of a tree item.
 * @interface
 * @property {string} uid - The uuid of owner of the tree item.
 * @property {string} name - The name of the tree item.
 * @property {string} treeItemId - The unique identifier of the tree item.
 * @property {ItemType} type - The type of the item, distinguishing between chat and folder.
 * @property {Date} createdAt - The creation date of the tree item.
 * @property {Date} updatedAt - The update date of the tree item.
 * @property {string} [parentId] - Optional. The ID of the parent folder, if any.
 */
export interface TreeItem {
  uid: string;
  name: string;
  treeItemId: string;
  type: ItemType;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  fileCollectionId: string;
}

/**
 * Extends TreeItem to define the structure of a folder item, adding folder-specific properties.
 * @interface
 * @property {string} [matterId] - Optional. A external matterId for the folder.
 * @property {string} [description] - Optional. A description of the folder's contents or purpose.
 * @property {string} [isArchived] - Optional. A boolean for if the folders is archived.
 */
export interface FolderItem extends TreeItem {
  matterId?: string;
  description?: string;
  isArchived?: boolean;
}
