import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { debounce } from 'lodash';
import { FolderItem, TreeItem } from '../@types/sidebar';
import { Endpoints } from '../utils/api';
import { UserAuth } from 'react';
import { useMfeContextUtilsStore } from './useMfeContextUtilsStore';
import i18nInstance from '../utils/i18n';
import { useBreadCrumbStore } from './useBreadcrumbStore';
import { GENERATE_CHAT_NAME_WAIT_TIME } from '../utils/constatnts';
import { UserProfile } from 'react/dist/types/auth';

export enum SortOptions {
  BY_DATE = 'by_date',
  BY_NAME = 'by_name',
  BY_TYPE = 'by_type'
}

export const ITEM_TYPE = {
  CHAT: 'chat',
  FOLDER: 'folder'
} as const;

/**
 * Defines the structure and types of the state managed in the ChatSidebarStore.
 * @interface ChatSidebarState
 * @property {UserAuth|undefined} userAuth - The user authentication state.
 * @property {(TreeItem|FolderItem)[]|undefined} chatsAndFolders - The list of chats and folders.
 * @property {string} sortType - The current sorting type for displaying the chats and folders.
 * @property {FolderItem|undefined} activeFolder - The currently active folder.
 * @property {TreeItem|undefined} activeChat - The currently active chat.
 * @property {Function} fetchChatList - Function to fetch the list of chats and folders based on the current sort type.
 * @property {Function} deleteChat - Function to delete a chat by its identifier.
 * @property {Function} createChat - Function to create a new chat.
 * @property {Function} updateChatName - Function to update the name of a chat.
 * @property {Function} setSortType - Function to update the sorting type and fetch the updated list.
 * @property {Function} setActiveFolder - Function to set the active folder and fetch its chats.
 * @property {Function} setActiveChat - Function to set the active chat.
 * @property {Function} setUserAuth - Function to set the user authentication state.
 */
export interface ChatSidebarState {
  userAuth: UserAuth | undefined;
  chatsAndFolders?: (TreeItem | FolderItem)[];
  sortType: string;
  activeFolder?: FolderItem;
  activeChat?: TreeItem;
  archivedMattersView?: boolean;
  isNameUpdate: boolean;
  isMatterSettingsActive?: boolean;
  isMatterFilesActive: boolean;
  isLoading: boolean;
  activeUser: UserProfile;
  fetchChatList: () => void;
  deleteChat: (chatId: string) => void;
  createChat: (message: string, chatFolderIdentifier?: string) => Promise<string>;
  updateChatName: (chatId: string, newChatName: string) => void;
  generateChatName: (chatId: string, chatHistory: { role: string, content: string | undefined }[]) => void;
  setSortType: (newSortType: string) => void;
  setActiveFolder: (newActiveFolder?: FolderItem) => void;
  setActiveChat: (newActiveChat?: TreeItem) => void;
  setUserAuth: (userAuth: UserAuth) => void;
  toggleArchivedMattersView: () => void;
  setIsMattersettingsActive: (isMatterSettingsActive: boolean) => void;
  refreshActiveFolder: () => Promise<void>;
  setIsMatterFilesActive: (isMatterFilesActive: boolean) => void;
  setIsNameUpdate: (isNameUpdateNewValue: boolean) => void;
  setActiveUser: (activeUser: UserProfile) => void;
}

/**
 * The base URL constructor for API endpoints, utilizes the environment variable for the app's domain.
 * @param {string} endpoint - The API endpoint to be appended to the base domain.
 * @returns {string} The full URL for the API call.
 */
const BASE_URL = (endpoint: string) => `${process.env.APP_DOMAIN}/api/${endpoint}`;

// const SAMPLE_CHATS: TreeItem[] = [
//   {
//     treeItemId: 'c91fed15-2e50-45eb-a59a-666666667777',
//     name: '--A - CREATE NEW CHAT--',
//     createdAt: new Date('2024-03-04T18:43:32.194686+00:00'),
//     updatedAt: new Date(),
//     type: 'chat',
//     fileCollectionId: ''
//   },
//   {
//     treeItemId: 'c91fed15-2e50-45eb-a59a-cebe44e2bf7b',
//     name: 'ZZZConversation Naming Assistant Capabilities',
//     createdAt: new Date('2024-03-04T18:43:32.194686+00:00'),
//     updatedAt: new Date('2024-03-04T18:43:32.194686+00:00'),
//     type: 'chat',
//     fileCollectionId: ''
//   },
//   {
//     treeItemId: '5a44626f-b1b8-4943-acc3-62651e2c39a3',
//     name: 'PDF File Upload: 070823vanliere (1)',
//     createdAt: new Date('2024-03-05T16:32:52.361758+00:00'),
//     updatedAt: new Date('2024-03-05T16:32:52.361758+00:00'),
//     type: 'chat',
//     fileCollectionId: ''
//   }
// ];

/**
 * Zustand store to manage the sidebar state, including chats and folders and related actions.
 * Uses axios for HTTP requests and lodash's debounce for limiting the rate of API calls.
 */
export const useChatSidebarStore = create<ChatSidebarState>()(
  devtools(
    (set, get) => ({
      userAuth: undefined,
      chatsAndFolders: [],
      sortType: SortOptions.BY_DATE,
      activeFolder: undefined,
      activeChat: undefined,
      isMatterSettingsActive: undefined,
      isMatterFilesActive: false,
      isNameUpdate: false,
      isLoading: false,
      activeUser: {
        email: '',
        firstName: '',
        lastName: '',
        username: '',
        registrationKey: '',
        region: '',
        id: ''
      },
      /**
       * Fetches the list of chats and folders based on the current sort type.
       * Uses a debounced function to limit the rate of API calls.
       * Sets isLoading to true during the fetch operation.
       */
      fetchChatList: debounce(async () => {
        // Set loading state to true when starting fetch
        set({ isLoading: true });
        try {
          const res = await axios.get(BASE_URL(Endpoints.LIST), {
            params: {
              sortType: get().sortType,
              parentId: get().activeFolder?.treeItemId,
              onlyArchivedMatters: get().archivedMattersView,
              uid: get().activeUser.id
            }
          });
          // Validate API response and update state with new data
          const chatsAndFolders = Array.isArray(res.data) ? res.data : [];
          if (!Array.isArray(res.data)) {
            console.error('API returned unexpected data structure for fetchChatList:', res.data);
          }
          set({ chatsAndFolders, isLoading: false });
        } catch (error) {
          // Make sure to set loading to false even if there's an error
          console.error('Error fetching chat list:', error);
          set({ isLoading: false });
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
        }
      }),
      /**
       * Deletes a chat by its identifier and refreshes the chat list.
       * Uses a debounced function to limit the rate of API calls.
       *
       * @param {string} chatId - The identifier of the chat to be deleted.
       */
      deleteChat: debounce(async (chatId: string) => {
        const deleteChatResult = await axios.delete(BASE_URL(Endpoints.CHAT_BY_ID), {
          data: { id: chatId, user: get().activeUser }
        });
        if (deleteChatResult.status === 200) {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('CHAT_DELETE_SUCCESS'), 'success');
        } else {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
        }
        get().setActiveChat();
        get().fetchChatList();
      }),

      /**
       * Creates a new chat and returns the chat ID.
       *
       * @param {string} [chatFolderIdentifier] - The identifier of the chat folder.
       * @returns {Promise<string>} The new chat ID.
       */
      createChat: async (message: string | undefined, chatFolderIdentifier?: string): Promise<string> => {
        const newChatData = await axios.post(
          BASE_URL(Endpoints.LIST),
          {
            parentId: chatFolderIdentifier,
            user: get().activeUser
          },
          { withCredentials: true }
        );

        get().setActiveChat(newChatData.data.newChat as TreeItem);
        console.info(`Created new chat with ID: ${newChatData.data.newChat.treeItemId}`);
        get().generateChatName(newChatData.data.newChat.treeItemId, [{ role: 'user', content: message ?? ''}] );
        return newChatData.data.newChat.treeItemId as string;
      },
      /**
       * Generates a new name for a chat and updates the chat name.
       * Uses a debounced function to limit the rate of API calls.
       *
       * @param {string} chatId - The identifier of the chat to be updated.
       */
      generateChatName: debounce(async (chatId: string, chatHistory: { role: string, content: string | undefined }[]) => {
        setTimeout(async () => {
          try {
            const generatedName = await axios.post(BASE_URL('generate-name'), { chatId, chat_history: chatHistory });

            if (generatedName.data.newName) {
              const activeChat = get().activeChat;

              if (activeChat !== undefined && activeChat.treeItemId === chatId) {
                set({ isNameUpdate: true });
                get().setActiveChat({ ...activeChat, name: generatedName.data.newName });
                
                // wait for a moment then update the chat list.
                setTimeout(() => {
                  get().fetchChatList();
                }, GENERATE_CHAT_NAME_WAIT_TIME);
              }
            }
          } catch (error) {
            console.error('Error generating chat name:', error);
            useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
          }          
        }, GENERATE_CHAT_NAME_WAIT_TIME);
      }),
      /**
       * Updates the name of a chat and refreshes the chat list.
       * Uses a debounced function to limit the rate of API calls.
       *
       * @param {string} chatId - The identifier of the chat to be updated.
       * @param {string} newChatName - The new name for the chat.
       */
      updateChatName: debounce(async (chatId: string, newChatName: string) => {
        await axios
          .post(BASE_URL(`chat/${chatId}/rename`), { id: chatId, updates: { name: newChatName }, user: get().activeUser })
          .then(() => {
            useBreadCrumbStore.getState().updateBreadcrumb(chatId, newChatName);
            set({ isNameUpdate: true });
            const activeChat = get().activeChat;
            if (activeChat !== undefined && activeChat.treeItemId === chatId) {
              get().setActiveChat({ ...activeChat, name: newChatName });
            }
            get().fetchChatList();
          });
      }),
      /**
       * Updates the sorting type and fetches the updated list of chats and folders.
       *
       * @param {string} newSortType - The new sorting type.
       */
      setSortType: (newSortType: string) => {
        set({ sortType: newSortType });
        get().fetchChatList();
      },
      /**
       * Sets the active folder and fetches the list of chats within the active folder.
       *
       * @param {FolderItem|undefined} newActiveFolder - The new active folder.
       */
      setActiveFolder: (newActiveFolder?: FolderItem) => {
        if (newActiveFolder) {
          useBreadCrumbStore.getState().addBreadcrumb({
            icon: 'folder',
            label: newActiveFolder.name,
            href: 'javascript:;',
            onClick: () => {
              get().setActiveChat();
            },
            testId: newActiveFolder.treeItemId
          });
          get().fetchChatList();
        } else {
          const prevFolder = get().activeFolder;
          if (prevFolder) {
            useBreadCrumbStore.getState().removeBreadcrumb(prevFolder.treeItemId);
          }

          get().setIsMatterFilesActive(false);
          get().setIsMattersettingsActive(false);
          get().fetchChatList();
        }
        set({ activeFolder: newActiveFolder });
      },
      /**
       * Sets the active chat.
       *
       * @param {TreeItem|undefined} newActiveChat - The new active chat.
       */
      setActiveChat: (newActiveChat?: TreeItem) => {
        if (newActiveChat) {
          useBreadCrumbStore.getState().addBreadcrumb({
            icon: 'message-lines',
            label: newActiveChat.name,
            href: 'javascript:;',
            onClick: () => {},
            testId: newActiveChat.treeItemId
          });
        }
        const prevActiveChat = get().activeChat;
        if (prevActiveChat) {
          useBreadCrumbStore.getState().removeBreadcrumb(prevActiveChat.treeItemId);
        }

        get().setIsMattersettingsActive(false);
        get().setIsMatterFilesActive(false);
        set({ activeChat: newActiveChat });
      },
      /**
       * Sets the user authentication state.
       *
       * @param {UserAuth} userAuth - The user authentication state.
       */
      setUserAuth: (userAuth: UserAuth) => {
        set({ userAuth });
      },
      /**
       * Toggle archived matters view
       */
      toggleArchivedMattersView: () => {
        set({ archivedMattersView: !get().archivedMattersView });

        if (get().archivedMattersView) {
          useBreadCrumbStore.getState().addBreadcrumb({
            icon: 'box-archive',
            label: 'Archived Matters',
            href: 'javascript:;',
            onClick: () => {
              get().setActiveFolder(undefined);
            },
            testId: 'archived_matters'
          });
        } else {
          useBreadCrumbStore.getState().removeBreadcrumb('archived_matters');
        }

        get().fetchChatList();
        /** Sets the matter settings active state.
         *
         * @param {boolean} isMatterSettingsActive - The value to be set.
         */
      },
      setIsMattersettingsActive: (isMatterSettingsActive: boolean) => {
        if (isMatterSettingsActive) {
          useBreadCrumbStore.getState().addBreadcrumb({
            icon: 'gear',
            label: 'Matter settings',
            href: 'javascript:;',
            onClick: () => {},
            testId: 'matter_settings'
          });
        } else {
          useBreadCrumbStore.getState().removeBreadcrumb('matter_settings');
        }
        set({ isMatterSettingsActive });
      },
      /**
       * Sets the matter settings active state.
       *
       * @param {boolean} isMatterSettingsActive - The value to be set.
       */
      setIsMatterFilesActive: (isMatterFilesActive: boolean) => {
        if (isMatterFilesActive) {
          useBreadCrumbStore.getState().addBreadcrumb({
            icon: 'files',
            label: 'Matter files',
            href: 'javascript:;',
            onClick: () => {},
            testId: 'matter_files'
          });
        } else {
          useBreadCrumbStore.getState().removeBreadcrumb('matter_files');
        }
        set({ isMatterFilesActive });
      },
      refreshActiveFolder: async () => {
        const activeFolder = get().activeFolder;
        if (!activeFolder) return;

        try {
          const res = await axios.get(BASE_URL(Endpoints.LIST), {
            params: {
              sortType: get().sortType,
              parentId: get().activeFolder?.treeItemId,
              onlyArchivedMatters: get().archivedMattersView,
              uid: get().activeUser.id
            }
          });
          
          const chatsAndFolders = res.data;
          if (Array.isArray(chatsAndFolders)) {
            const folderToRefresh = chatsAndFolders.find((item) => item.treeItemId === activeFolder.treeItemId);
            if (folderToRefresh) {
              set({ activeFolder: folderToRefresh });
            }
          } else {
            console.error('API returned unexpected data structure for refreshActiveFolder:', chatsAndFolders);
            useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
          }
        } catch (error) {
          console.error('Error refreshing active folder:', error);
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
        }
      },
      setIsNameUpdate(isNameUpdateNewValue) {
        set({ isNameUpdate: isNameUpdateNewValue });
      },
      setActiveUser(activeUser: UserProfile) {
        set({ activeUser });
      }
    }),
    { name: 'useChatSidebarStore' }
  )
);
