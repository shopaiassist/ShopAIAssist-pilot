/**
 * Enumeration of available sorting options for lists.
 */
export type SortOptions = 'by_name' | 'by_date' | 'by_type';

/**
 * Defines the type of items, which can be either a folder or a chat.
 */
export type ItemType = 'folder' | 'chat';

/**
 * Defines the structure of a tree item.
 * @interface
 * @property {string} name - The name of the tree item.
 * @property {string} treeItemId - The unique identifier of the tree item.
 * @property {ItemType} type - The type of the item, distinguishing between chat and folder.
 * @property {Date} createdAt - The creation date of the tree item.
 * @property {Date} updatedAt - The update date of the tree item.
 * @property {string} [parentId] - Optional. The ID of the parent folder, if any.
 */
interface TreeItem {
  name: string;
  treeItemId: string;
  type: ItemType;
  createdAt: Date;
  updatedAt: Date;
  fileCollectionId: string;
  parentId?: string;
}

/**
 * Extends TreeItem to define the structure of a folder item, adding folder-specific properties.
 * @interface
 * @property {string} [matterId] - Optional. A external matterId for the folder.
 * @property {string} [description] - Optional. A description of the folder's contents or purpose.
 * @property {string} [isArchived] - Optional. A boolean for if the folders is archived.
 */
interface FolderItem extends TreeItem {
  matterId?: string;
  description?: string;
  isArchived?: boolean;
}
