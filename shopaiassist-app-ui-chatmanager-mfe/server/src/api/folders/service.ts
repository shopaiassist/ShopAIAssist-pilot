import MongoConnection from 'server/src/db';
import { MissingPropertyError, DatabaseError, NotFoundError, FolderCreationError } from '../../lib/errors';
import Folders from '../../db/datalayer/folders';
import { v4 as uuidv4 } from 'uuid';
import { FolderItem } from '../../lib/shared/chat-management-types';
import { isEmpty } from 'lodash';
import { LOG } from 'react';
import { UserProfile } from 'react/dist/types/auth';
import { IncomingHttpHeaders } from 'http';
import MercuryIntegration from '../../lib/files/service';
import Chats from '../../db/datalayer/chats';

/**
 * Manages folder-related operations including creation, deletion, and updates.
 * This class acts as a service layer that interfaces with a database through a specific data access object.
 */
export default class FolderManagement {
  protected folders: Folders;
  protected chats: Chats;
  protected mercuryIntegration: MercuryIntegration;
  /**
   * Initializes a new instance of FolderManagement with a database connection.
   *
   * @param {MongoConnection} dbConnection - The database connection used to interact with folder data.
   */
  constructor(dbConnection: MongoConnection) {
    this.folders = new Folders(dbConnection);
    this.chats = new Chats(dbConnection);
    this.mercuryIntegration = new MercuryIntegration();
  }

  /**
   * Creates a new folder in the database using the provided folder data.
   * Throws an error if required data is missing.
   *
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @param {Partial<FolderItem>} folderData - Data for the new folder, must include at least a 'name'.
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @returns {Promise<string>} The unique identifier of the newly created folder.
   * @throws {MissingPropertyError} If the 'name' property is missing.
   * @throws {FolderCreationError} If there is an error during the folder creation process.
   */
  async createNewFolder(
    user: Record<string, string> & UserProfile,
    folderData: Partial<FolderItem>,
    headers: IncomingHttpHeaders
  ): Promise<FolderItem> {
    if (folderData.name) {
      const newFolderId = uuidv4();
      const fileCollectionId = await this.mercuryIntegration.createFileCollectionId(headers, user);
      if (fileCollectionId) {
        const newFolder = await this.folders.insertFolder({
          type: 'folder',
          name: folderData.name,
          description: folderData.description,
          matterId: folderData.matterId,
          treeItemId: newFolderId,
          uid: user.id,
          fileCollectionId
        });
        return newFolder;
      } else {
        throw new FolderCreationError(`Unable to create new folder for user: ${user.id}, missing fileCollectionId`);
      }
    } else {
      LOG.error('Missing folderName for new folder');
      throw new MissingPropertyError('Missing folderName for new Chat');
    }
  }

  /**
   * Deletes a folder based on its ID.
   * Throws an error if the folder is not found.
   *
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @param {string} treeItemIdToDelete - The ID of the folder to delete.
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @returns {Promise<void>} A promise that resolves when the delete operation is complete.
   * @throws {NotFoundError} If no folder with the given ID is found.
   * @throws {MissingPropertyError} If the folder ID is not included in the request.
   */
  async deleteFolder(
    user: Record<string, string> & UserProfile,
    treeItemIdToDelete: string,
    headers: IncomingHttpHeaders
  ): Promise<void> {
    if (treeItemIdToDelete) {
      const folderFileCollectionId = await this.folders.getFolderFileCollectionId(treeItemIdToDelete);
      const result = await this.folders.deleteFolder(user.id, treeItemIdToDelete);
      if (result.deletedCount === 0) {
        throw new NotFoundError(`folder with id:${treeItemIdToDelete} not found`);
      } else {
        const chatsToDelete = await this.chats.findChats({ parentId: treeItemIdToDelete });
        if (chatsToDelete.length) {
          for (const chat of chatsToDelete) {
            await this.chats.deleteChat(user.id, chat.treeItemId);
          }
        }
        try {
          if (folderFileCollectionId) {
            await this.mercuryIntegration.deleteFileCollection(headers, user, folderFileCollectionId);
          }
        } catch (error) {
          LOG.error(`Deletion of file collection ${folderFileCollectionId} failed`);
          throw error;
        }
      }
    } else {
      throw new MissingPropertyError('folder id not included with request');
    }
  }

  /**
   * Updates a folder using the provided ID and update data.
   * Throws an error if the folder is not found or if updates are not provided.
   *
   * @param {string} uid - The user identifier.
   * @param {string} treeItemIdToUpdate - The ID of the folder to update.
   * @param {Partial<FolderItem>} updates - The updates to apply to the folder.
   * @returns {Promise<void>} A promise that resolves when the update operation is complete.
   * @throws {NotFoundError} If no folder with the given ID is found.
   * @throws {MissingPropertyError} If updates are not provided.
   * @throws {DatabaseError} If the update operation fails.
   */
  async updateFolder(uid: string, treeItemIdToUpdate: string, updates: Partial<FolderItem>): Promise<void> {
    if (updates && !isEmpty(updates)) {
      const result = await this.folders.updateFolder(uid, treeItemIdToUpdate, updates);
      if (result.modifiedCount === 0) {
        throw new NotFoundError(`folder with id:${treeItemIdToUpdate} not found`);
      } else if (result.acknowledged === false) {
        throw new DatabaseError();
      }
    } else {
      throw new MissingPropertyError('updates not included with request');
    }
  }
}
