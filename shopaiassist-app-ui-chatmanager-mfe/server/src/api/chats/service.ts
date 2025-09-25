import MongoConnection from 'server/src/db';
import Chats from '../../db/datalayer/chats';
import { MissingPropertyError, NotFoundError, ChatServiceError } from '../../lib/errors';
import { TreeItem } from '../../lib/shared/chat-management-types';
import { DEFAULT_REGION, createHeaders } from '../../lib/utils/routes-utils';
import { IncomingHttpHeaders } from 'http';
import { UserProfile } from 'react/dist/types/auth';
import Folders from '../../db/datalayer/folders';

/**
 * Manages chat operations such as creation, deletion, and updates in the database.
 * This class provides a high-level API for interacting with the chat data layer.
 */
export default class ChatManagement {
  protected chats: Chats;
  protected folders: Folders;

  /**
   * Initializes a new instance of ChatManagement with a database connection.
   *
   * @param {MongoConnection} dbConnection - The database connection to use for chat operations.
   */
  constructor(dbConnection: MongoConnection) {
    this.chats = new Chats(dbConnection);
    this.folders = new Folders(dbConnection);
  }

  /**
   * Creates a new chat entry in the database.
   *
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @param {string} [parentId] - The identifier of the parent chat or folder.
   * @returns {Promise<TreeItem>} The created chat item.
   * @throws {MissingPropertyError} If the chatId is not provided in the response from the backend API.
   */
  async createNewChat(
    headers: IncomingHttpHeaders,
    user: Record<string, string> & UserProfile,
    parentId?: string
  ): Promise<TreeItem> {
    console.log(`Chatmgmt MFE -> createNewChat -> User (user): ${JSON.stringify(user)}`);

    const backendApiUrl = ChatManagement.getShopAIAssistBackendUrl(user?.region);
    const newChatRequest = await fetch(`${encodeURI(backendApiUrl)}/chat`, {
      method: 'POST',
      headers: { ...createHeaders(headers), 'content-length': '0' }
    });
    const newData = await newChatRequest.json();
    
    if (newData.id) {
      return {
        type: 'chat',
        name: newData.name ?? 'Untitled Chat',
        treeItemId: newData.id,
        parentId,
        uid: user.id,
        fileCollectionId: '',
        createdAt: newData.createdAt,
        updatedAt: newData.updatedAt,
      }
    } else {
      throw new MissingPropertyError('Missing chatId for new Chat');
    }
  }

  /**
   * Deletes an existing chat from the database.
   *
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @param {string} treeItemIdToDelete - The ID of the chat to delete.
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @returns {Promise<void>} A promise that resolves when the delete operation is complete.
   * @throws {NotFoundError} If no chat is found with the provided ID.
   * @throws {MissingPropertyError} If the chat ID to delete is not provided.
   * @throws {ChatServiceError} If the delete operation fails for any other reason.
   */
  async deleteChat(
    user: Record<string, string> & UserProfile,
    treeItemIdToDelete: string,
    headers: IncomingHttpHeaders
  ): Promise<void> {
    if (!treeItemIdToDelete) {
      throw new MissingPropertyError('Chat ID to delete is not provided');
    }

    console.log(`Chatmgmt MFE -> deleteChat -> User (user): ${JSON.stringify(user)}`);
    console.log(`Chatmgmt MFE -> deleteChat -> Chat ID (treeItemIdToDelete): ${treeItemIdToDelete}`);
    
    const backendApiUrl = ChatManagement.getShopAIAssistBackendUrl(user?.region);
    const deleteResponse = await fetch(`${backendApiUrl}/chat/${treeItemIdToDelete}`, {
      method: 'DELETE',
      headers: createHeaders(headers)
    });

    if (!deleteResponse.ok) {
      if (deleteResponse.status === 404) {
        throw new NotFoundError(`Chat with ID: ${treeItemIdToDelete} not found`);
      } else {
        const errorData = await deleteResponse.json().catch(() => ({}));
        throw new ChatServiceError(`Failed to delete chat: ${errorData.message ?? deleteResponse.statusText}`);
      }
    }
  }

  /**
   * Updates a chat name by connecting to the rename endpoint.
   *
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @param {string} chatId - The ID of the chat to rename.
   * @param {string} newName - The new name for the chat.
   * @returns {Promise<void>} A promise that resolves when the rename operation is complete.
   * @throws {NotFoundError} If no chat is found with the provided ID.
   * @throws {MissingPropertyError} If chat ID or new name is not provided.
   * @throws {ChatServiceError} If the rename operation fails.
   */
  async updateChat(
    headers: IncomingHttpHeaders,
    user: Record<string, string> & UserProfile,
    chatId: string, 
    newName: string
  ): Promise<void> {
    if (!chatId) {
      throw new MissingPropertyError('Chat ID to update is not provided');
    }
    
    if (!newName) {
      throw new MissingPropertyError('New name is not provided');
    }

    console.log(`Chatmgmt MFE -> updateChat -> User: ${JSON.stringify(user)}`);
    console.log(`Chatmgmt MFE -> updateChat -> Chat ID: ${chatId}, New name: ${newName}`);
    
    const backendApiUrl = ChatManagement.getShopAIAssistBackendUrl(user?.region);
    const updateResponse = await fetch(`${backendApiUrl}/chat/${chatId}/rename`, {
      method: 'POST',
      headers: {
        ...createHeaders(headers),
        'content-type': 'application/json'
      },
      body: JSON.stringify({ new_name: newName })
    });

    if (!updateResponse.ok) {
      if (updateResponse.status === 404) {
        throw new NotFoundError(`Chat with ID: ${chatId} not found`);
      } else {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new ChatServiceError(`Failed to rename chat: ${errorData.message ?? updateResponse.statusText}`);
      }
    }
  }

  /**
   * Generates a new name for a chat.
   *
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @param {string} chatId - The identifier of the chat for which to generate a new name.
   * @param {chatHistory: { role: string, content: string | undefined }[]} chat_history - The chat history for which to generate a new name.
   * @returns {Promise<string>} A promise that resolves to the generated chat name.
   * @throws {ChatServiceError} If unable to generate a name for the chat.
   */
  async generateChatName(
    headers: IncomingHttpHeaders,
    user: Record<string, string> & UserProfile,
    chatId: string,
    chat_history: { role: string, content: string | undefined }[]
  ): Promise<string> {
    console.log(`Chatmgmt MFE -> generateChatName -> User: ${JSON.stringify(user)}`);

    const backendApiUrl = ChatManagement.getShopAIAssistBackendUrl(user?.region);
    const newChatNameRequest = await fetch(`${backendApiUrl}/chat/${chatId}/generate-name`, {
      method: 'POST',
      headers: { ...createHeaders(headers)},
      body: JSON.stringify({ chat_history }), // Stringify the body as JSON
    });
    const newData = await newChatNameRequest.json();
    if (newData?.name) {
      return newData.name;
    } else {
      throw new ChatServiceError(`Unable to generate name for chat ${chatId}`);
    }
  }

  /**
   * Retrieves a list of all chats for the user and applies sorting based on the provided sort type.
   *
   * @param {IncomingHttpHeaders} headers - The HTTP headers from the incoming request.
   * @param {Record<string, string> & UserProfile} user - The user object containing user details, including profile information.
   * @param {string} [sortType] - The type of sorting to apply to the results ('by_name', 'by_date', or 'by_type').
   * @returns {Promise<Array<TreeItem>>} A promise that resolves to an array of chat metadata objects.
   * @throws {ChatServiceError} If unable to retrieve chats.
   */
  async getChats(
    headers: IncomingHttpHeaders,
    user: Record<string, string> & UserProfile,
    sortType?: string
  ): Promise<Array<TreeItem>> {
    console.log(`Chatmgmt MFE -> getChats -> User: ${JSON.stringify(user)}`);
    console.log(`Chatmgmt MFE -> getChats -> Sort Type: ${sortType}`);
    
    const backendApiUrl = ChatManagement.getShopAIAssistBackendUrl(user?.region);
    const response = await fetch(`${backendApiUrl}/chat`, {
      method: 'GET',
      headers: createHeaders(headers)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ChatServiceError(`Failed to retrieve chats: ${errorData.message ?? response.statusText}`);
    }

    const chats = await response.json();
    
    // Apply sorting based on sortType
    if (sortType) {
      return this.sortChats(chats, sortType);
    }
    
    return chats;
  }

  /**
   * Sorts an array of chat items based on the specified sort type.
   * 
   * @param {Array<TreeItem>} chats - The array of chat items to sort.
   * @param {string} sortType - The type of sorting to apply ('by_name', 'by_date', or 'by_type').
   * @returns {Array<TreeItem>} The sorted array of chat items.
   */
  private sortChats(chats: Array<TreeItem>, sortType: string): Array<TreeItem> {
    if (!chats || !chats.length) {
      return [];
    }

    switch (sortType) {
      react 'by_name':
        return [...chats].sort((a, b) => {
          // react insensitive sort by name
          return (a.name || '').toLowerreact().localeCompare((b.name || '').toLowerreact());
        });
        
      react 'by_date':
        return [...chats].sort((a, b) => {
          // Sort by createdAt date (newest first)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
      react 'by_type':
        return [...chats].sort((a, b) => {
          // Sort by type (folders first, then chats)
          if (a.type === b.type) {
            // If same type, sort by name
            return (a.name || '').toLowerreact().localeCompare((b.name || '').toLowerreact());
          }
          return a.type === 'folder' ? -1 : 1;
        });
        
      default:
        // Default to date sorting if sortType is not recognized
        return [...chats].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
    }
  }

  /**
   * Get ShopAIAssist backend URL from config based on the user's region info.
   *
   * @param {string} [region=DEFAULT_REGION] - The region identifier.
   * @returns {string} The ShopAIAssist backend URL for the specified region.
   */
  public static getShopAIAssistBackendUrl(region = DEFAULT_REGION): string {
    // TODO: This should throw (or throw on startup) if SHOPAIASSIST_BACKEND_SERVICE_URL_REGIONS is not defined.
    const shopaiassistBackendConfig = JSON.parse(process.env.SHOPAIASSIST_BACKEND_SERVICE_URL_REGIONS ?? '{}');
    const backendUrl = shopaiassistBackendConfig[region];
    console.log(`Chatmgmt MFE -> getShopAIAssistBackendUrl -> Backend URL: ${backendUrl}`);
    return backendUrl;
  }
}
