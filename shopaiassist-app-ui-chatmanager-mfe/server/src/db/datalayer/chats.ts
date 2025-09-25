import { Model } from 'mongoose';
import MongoConnection from '..';
import { EXCLUDED_MONGO_PROPERTIES, MONGO_DUPLICATE_ERROR_CODE } from '../utils/mongo-utils';
import { TreeItem } from 'server/src/lib/shared/chat-management-types';
import { ChatsSchema } from '../schemas/chats-schema';
import { DuplicateEntryError } from '../../lib/errors';

/**
 * Data layer class for accessing the Chats Mongo collection.
 * This class provides methods to interact with the chats collection in MongoDB.
 */
export default class Chats {
  public chatsModel: Model<TreeItem>;

  /**
   * Initializes a new Chats data access object with a connection to the database.
   * @param {MongoConnection} dbConnection - The database connection used to interact with MongoDB.
   */
  constructor(dbConnection: MongoConnection) {
    this.chatsModel = dbConnection.getDbCollection(ChatsSchema.COLLECTION_NAME, ChatsSchema.SCHEMA);
  }

  /**
   * Inserts a new chat document into the Chats collection.
   * @param {Partial<TreeItem>} chatData - The chat document data to insert.
   * @returns {Promise<TreeItem>} A promise that resolves to the inserted chat item.
   * @throws {DuplicateEntryError} If a chat with the same unique identifier already exists.
   */
  async insertChat(chatData: Partial<TreeItem>): Promise<TreeItem> {
    try {
      return await this.chatsModel.create(chatData);
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
   * Finds chat documents in the Chats collection based on provided filters.
   * @param {Partial<TreeItem>} [filters] - Optional filters to apply to the query.
   * @returns {Promise<TreeItem[]>} A promise that resolves to an array of found chat items.
   */
  async findChats(filters?: Partial<TreeItem>): Promise<TreeItem[]> {
    return await this.chatsModel
      .find(
        { ...filters, parentId: filters?.parentId ? filters.parentId : { $exists: false } },
        EXCLUDED_MONGO_PROPERTIES
      )
      .sort({ updatedAt: -1 });
  }

  /**
   * Deletes a chat document from the Chats collection by its identifier.
   *
   * @param {string} uid - The user identifier.
   * @param {string} treeItemId - The identifier of the chat to delete.
   * @returns {Promise<{ deletedCount?: number }>} A promise that resolves to the result of the deletion operation.
   */
  async deleteChat(uid: string, treeItemId: string): Promise<{ deletedCount?: number }> {
    return await this.chatsModel.deleteOne({ treeItemId, uid });
  }

  /**
   * Updates a chat document in the Chats collection.
   *
   * @param {string} uid - The user identifier.
   * @param {string} treeItemId - The identifier of the chat to update.
   * @param {Partial<TreeItem>} updates - The updates to apply to the chat document.
   * @returns {Promise<{ modifiedCount: number; acknowledged: boolean }>} A promise that resolves to the result of the update operation.
   */
  async updateChat(
    uid: string,
    treeItemId: string,
    updates: Partial<TreeItem>
  ): Promise<{ modifiedCount: number; acknowledged: boolean }> {
    return await this.chatsModel.updateOne({ treeItemId, uid }, { $set: { ...updates } });
  }

  /**
   * Retrieves the file collection ID for a specific chat.
   * Finds the chat document in the Chats collection based on the provided tree item ID.
   *
   * @param {string} treeItemId - The identifier of the chat to find.
   * @returns {Promise<string | undefined>} A promise that resolves to the file collection ID of the found chat item, or undefined if not found.
   */
  async getChatFileCollectionId(treeItemId: string): Promise<string | undefined> {
    const chatToFind = await this.chatsModel.findOne({ treeItemId }, EXCLUDED_MONGO_PROPERTIES);
    return chatToFind?.fileCollectionId;
  }

  /**
   * Retrieves the parent ID for a specific chat.
   * Finds the chat document in the Chats collection based on the provided tree item ID.
   *
   * @param {string} treeItemId - The identifier of the chat to find.
   * @returns {Promise<string | undefined>} A promise that resolves to the parent ID of the found chat item, or undefined if not found.
   */
  async getChatParentId(treeItemId: string): Promise<string | undefined> {
    const chatToFind = await this.chatsModel.findOne({ treeItemId }, EXCLUDED_MONGO_PROPERTIES);
    return chatToFind?.parentId;
  }

  /**
   * Checks if a chat exists in the Chats collection based on the provided tree item ID.
   *
   * @param {string} treeItemId - The identifier of the chat to find.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the chat exists.
   */
  async chatExists(treeItemId: string): Promise<boolean> {
    const chatToFind = await this.chatsModel.findOne({ treeItemId }, EXCLUDED_MONGO_PROPERTIES);
    return !!chatToFind;
  }
}
