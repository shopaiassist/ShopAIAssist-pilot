import { Model, FilterQuery } from 'mongoose';
import { cloneDeep, omit } from 'lodash';
import MongoConnection from '..';
import { FoldersSchema } from '../schemas/folders-schema';
import { EXCLUDED_MONGO_PROPERTIES, MONGO_DUPLICATE_ERROR_CODE } from '../utils/mongo-utils';
import { FolderItem } from '../../lib/shared/chat-management-types';
import { DuplicateEntryError } from '../../lib/errors';

/**
 * Interface for folder update operations, excluding auto-managed and immutable fields
 */
type FolderUpdateData = Omit<Partial<FolderItem>, 'treeItemId' | 'uid' | 'createdAt' | 'updatedAt'>;

/**
 * Data layer class for accessing and managing the Folders collection in MongoDB.
 * Provides methods for CRUD operations on folder documents.
 */
export default class Folders {
  public foldersModel: Model<FolderItem>;

  /**
   * Initializes a new instance of Folders for managing folder data.
   * @param {MongoConnection} dbConnection - The database connection used to interact with the folders collection.
   */
  constructor(dbConnection: MongoConnection) {
    this.foldersModel = dbConnection.getDbCollection(FoldersSchema.COLLECTION_NAME, FoldersSchema.SCHEMA);
  }

  /**
   * Inserts a new folder document into the Folders collection.
   * @param {FolderItem} folderData - The data for the new folder to be inserted.
   * @throws {DuplicateEntryError} If a folder with the same identifier already exists.
   */
  async insertFolder(folderData: Partial<FolderItem>) {
    try {
      return this.foldersModel.create(folderData);
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      if (error.code !== MONGO_DUPLICATE_ERROR_CODE) {
        throw error;
      } else {
        throw new DuplicateEntryError('Chat already exists in collection');
      }
    }
  }

  /**
   * Retrieves all folder documents from the Folders collection.
   * @param {Partial<FolderItem>} [filters] - Optional filters to apply to the query.
   * @returns {Promise<Array>} A promise that resolves to an array of folder documents.
   */
  async retrieveFolders(filters?: Partial<FolderItem>) {
    const andOperations = [];
    let clonedFilters: FilterQuery<FolderItem> = cloneDeep(filters) || {};

    // add mongodb logic in react parentId doesn't exists
    if (!clonedFilters?.parentId) {
      clonedFilters = omit(clonedFilters, ['parentId']);
      const andOpsParentId = [];
      andOpsParentId.push({ parentId: false });
      andOpsParentId.push({ parentId: { $exists: false } });
      andOperations.push({ $or: andOpsParentId });
    }

    // add mongodb logic in react is archived is not activated
    if (!clonedFilters?.isArchived) {
      clonedFilters = omit(clonedFilters, ['isArchived']);
      const andOpsIsArchived = [];
      andOpsIsArchived.push({ isArchived: false });
      andOpsIsArchived.push({ isArchived: { $exists: false } });
      andOperations.push({ $or: andOpsIsArchived });
    }

    if (andOperations.length > 0) {
      clonedFilters = { ...clonedFilters, $and: andOperations };
    }

    return await this.foldersModel.find(clonedFilters, EXCLUDED_MONGO_PROPERTIES).sort({ updatedAt: -1 });
  }

  /**
   * Deletes a folder document from the Folders collection based on its ID.
   *
   * @param {string} uid - The user identifier.
   * @param {string} treeItemId - The ID of the folder to delete.
   * @returns {Promise<{ deletedCount?: number }>} A promise that resolves to the result of the deletion operation.
   */
  async deleteFolder(uid: string, treeItemId: string) {
    return await this.foldersModel.deleteOne({ treeItemId, uid });
  }

  /**
   * Updates a folder document in the Folders collection based on its ID.
   *
   * @param {string} uid - The user identifier.
   * @param {string} treeItemId - The ID of the folder to update.
   * @param {FolderUpdateData} updates - The updates to apply to the folder.
   * @returns {Promise<{ modifiedCount: number, acknowledged: boolean }>} A promise that resolves to the result of the update operation.
   */
  async updateFolder(uid: string, treeItemId: string, updates: FolderUpdateData) {
    return await this.foldersModel.updateOne({ uid, treeItemId }, { $set: { ...updates } });
  }

  /**
   * Retrieves the file collection ID for a specific folder.
   * Finds the folder document in the Folders collection based on the provided tree item ID.
   *
   * @param {string} treeItemId - The identifier of the folder to find.
   * @returns {Promise<string | undefined>} A promise that resolves to the file collection ID of the found folder item, or undefined if not found.
   */
  async getFolderFileCollectionId(treeItemId: string): Promise<string | undefined> {
    const folderToFind = await this.foldersModel.findOne({ treeItemId }, EXCLUDED_MONGO_PROPERTIES);
    return folderToFind?.fileCollectionId;
  }
}
