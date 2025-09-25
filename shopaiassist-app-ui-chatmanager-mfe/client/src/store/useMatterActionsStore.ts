import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { debounce } from 'lodash';
import { FolderItem } from '../@types/sidebar';
import { useChatSidebarStore } from './useChatSidebarStore';
import { Endpoints } from '../utils/api';
import { useMfeContextUtilsStore } from './useMfeContextUtilsStore';
import i18nInstance from '../utils/i18n';
import { useBreadCrumbStore } from './useBreadcrumbStore';

export enum MatterDialogState {
  NEW_MATTER = 'new',
  DELETE_MATTER = 'delete',
  ARCHIVE_MATTER = 'archive',
  UNARCHIVE_MATTER = 'unarchive',
  UPDATE_MATTER = 'update'
}

type DialogState =
  | MatterDialogState.NEW_MATTER
  | MatterDialogState.DELETE_MATTER
  | MatterDialogState.ARCHIVE_MATTER
  | MatterDialogState.UNARCHIVE_MATTER
  | MatterDialogState.UPDATE_MATTER;

/**
 * Defines the structure and types of the state managed in the MatterActionsStore.
 * @interface MatterActionsState
 * @property {FolderItem|undefined} actionItem - The item currently being acted upon in the dialog.
 * @property {boolean} hideMatterActionsDialog - Indicates whether the matter actions dialog is hidden.
 * @property {DialogState} dialogState - The current state of the dialog (new, delete, archive, or update).
 * @property {Function} toggleMatterDialog - Function to toggle the visibility and state of the matter actions dialog.
 * @property {Function} createNewMatter - Function to create a new matter folder.
 * @property {Function} deleteFolder - Function to delete a folder by its identifier.
 * @property {Function} archiveFolder - Function to archive a folder by its identifier.
 * @property {Function} updateFolder - Function to update a folder by its identifier.
 */
export interface MatterActionsState {
  actionItem?: FolderItem;
  hideMatterActionsDialog: boolean;
  dialogState: DialogState;
  toggleMatterDialog: (dialogState?: DialogState, actionItem?: FolderItem) => void;
  createNewMatter: (folderInfo: Partial<FolderItem>) => void;
  deleteFolder: (folderId: string) => void;
  archiveFolder: (folderId: string) => void;
  unarchiveFolder: (folderId?: string) => void;
  updateFolder: (folderId: string, updates: Partial<FolderItem>) => void;
}

/**
 * The base URL constructor for API endpoints, utilizes the environment variable for the app's domain.
 * @param {string} endpoint - The API endpoint to be appended to the base domain.
 * @returns {string} The full URL for the API call.
 */
const BASE_URL = (endpoint: string) => `${process.env.APP_DOMAIN}/api/${endpoint}`;

/**
 * Zustand store to manage the state and actions related to matter creation, deletion, archiving, and dialog visibility.
 *
 * @returns {MatterActionsState} The state and actions for managing matter-related operations.
 */
export const useMatterActionsStore = create<MatterActionsState>()(
  devtools(
    (set, get) => ({
      actionItem: undefined,
      dialogState: MatterDialogState.NEW_MATTER,
      hideMatterActionsDialog: true,
      /**
       * Creates a new matter folder and refreshes the chat list.
       * Uses a debounced function to limit the rate of API calls.
       *
       * @param {Partial<FolderItem>} folderInfo - Partial information about the folder to be created.
       */
      createNewMatter: debounce(async (folderInfo: Partial<FolderItem>) => {
        await axios.post(BASE_URL(Endpoints.FOLDERS), { ...folderInfo }).then((response) => {
          useChatSidebarStore.getState().fetchChatList();
          useChatSidebarStore.getState().setActiveFolder(response.data.newFolder as FolderItem);
          set({
            hideMatterActionsDialog: !get().hideMatterActionsDialog,
            dialogState: undefined,
            actionItem: undefined
          });
        });
      }),
      /**
       * Deletes a folder by its identifier and refreshes the chat list.
       * Uses a debounced function to limit the rate of API calls.
       *
       * @param {string} folderId - The identifier of the folder to be deleted.
       */
      deleteFolder: debounce(async (folderId: string) => {
        const deleteFolderResponse = await axios.delete(BASE_URL(Endpoints.FOLDERS), { data: { id: folderId } });
        if (deleteFolderResponse.status === 200) {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('MATTER_DELETE_SUCCESS'), 'success');
        } else {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
        }
        useChatSidebarStore.getState().fetchChatList();
        set({
          hideMatterActionsDialog: !get().hideMatterActionsDialog,
          dialogState: undefined,
          actionItem: undefined
        });
      }),
      /**
       * Archives a folder by its identifier and refreshes the chat list.
       * Uses a debounced function to limit the rate of API calls.
       *
       * @param {string} folderId - The identifier of the folder to be archived.
       */
      archiveFolder: debounce(async (folderId: string) => {
        const archiveFolderResponse = await axios.patch(BASE_URL(Endpoints.FOLDERS), {
          id: folderId,
          updates: { isArchived: true }
        });
        if (archiveFolderResponse.status === 200) {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('MATTER_ARCHIVE_SUCCESS'), 'success');
        } else {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
        }
        useChatSidebarStore.getState().fetchChatList();
        set({
          hideMatterActionsDialog: !get().hideMatterActionsDialog,
          dialogState: undefined,
          actionItem: undefined
        });
      }),
      /**
       * Unarchives a folder by its identifier and refreshes the chat list.
       * Uses a debounced function to limit the rate of API calls.
       *
       * @param {string} folderId - The identifier of the folder to be archived.
       */
      unarchiveFolder: debounce(async (folderId?: string) => {
        if (!folderId) {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
          return;
        }

        useBreadCrumbStore.getState().removeBreadcrumb('archived_matters');
        useChatSidebarStore.getState().toggleArchivedMattersView();

        const unarchiveFolderResponse = await axios.patch(BASE_URL(Endpoints.FOLDERS), {
          id: folderId,
          updates: { isArchived: false }
        });
        if (unarchiveFolderResponse.status === 200) {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('MATTER_UNARCHIVE_SUCCESS'), 'success');
        } else {
          useMfeContextUtilsStore.getState().triggerAlert(i18nInstance.t('ERROR_MESSAGE'), 'error');
        }
        useChatSidebarStore.getState().fetchChatList();
        useChatSidebarStore.getState().refreshActiveFolder();
        set({
          dialogState: undefined,
          actionItem: undefined
        });
      }),
      /**
       * Updates a folder by its identifier and refreshes the chat list.
       * Uses a debounced function to limit the rate of API calls.
       *
       * @param {string} folderId - The identifier of the folder to be updated.
       * @param {Partial<FolderItem>} updates - The updates to apply to the folder.
       */
      updateFolder: debounce(async (folderId: string, updates: Partial<FolderItem>) => {
        await axios.patch(BASE_URL(Endpoints.FOLDERS), { id: folderId, updates }).then(() => {
          const isMatterSettingsActive = useChatSidebarStore.getState().isMatterSettingsActive;
          const hideMatterActionsDialog = get().hideMatterActionsDialog;
          if (updates.name) {
            useBreadCrumbStore.getState().updateBreadcrumb(folderId, updates.name);
          }

          useChatSidebarStore.getState().fetchChatList();

          if (useChatSidebarStore.getState().activeFolder) {
            useChatSidebarStore.getState().refreshActiveFolder();
          }

          set({
            hideMatterActionsDialog: isMatterSettingsActive ? hideMatterActionsDialog : !hideMatterActionsDialog,
            dialogState: undefined,
            actionItem: undefined
          });
        });
      }),
      /**
       * Toggles the visibility and state of the matter actions dialog.
       *
       * @param {DialogState} [dialogState] - The state of the dialog (new or delete).
       * @param {FolderItem} [actionItem] - The item currently being acted upon in the dialog.
       */
      toggleMatterDialog: (dialogState?: DialogState, newActionItem?: FolderItem) => {
        const currentDialogState = get().hideMatterActionsDialog;
        set({
          hideMatterActionsDialog: !currentDialogState,
          dialogState,
          actionItem: currentDialogState ? newActionItem : undefined
        });
      }
    }),
    { name: 'useMatterActionsStore' }
  )
);
