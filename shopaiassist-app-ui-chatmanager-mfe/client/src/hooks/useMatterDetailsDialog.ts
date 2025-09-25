import { useEffect, useState } from 'react';
import { MatterDialogState, useMatterActionsStore } from '../store/useMatterActionsStore';
import { useChatSidebarStore } from '../store/useChatSidebarStore';

export enum UpdateType {
  NAME = 'nickname',
  ID = 'id',
  DESCRIPTION = 'description'
}
/**
 * Custom hook to manage matter details dialog state and actions.
 *
 * This hook provides state management for matter name, ID, and description,
 * and includes functions to update these details and perform an action based on the dialog state.
 *
 * @returns {[
 *   string,
 *   string,
 *   string,
 *   { title: string; subTitle: string; actionButton: string },
 *   (updateType: UpdateType, updateValue: string) => void,
 *   () => void
 * ]} - Returns the matter name, ID, description,
 * dialog copy (title, subtitle, action button text), update function, and action function.
 *
 * @example
 * const [matterName, matterId, matterDescription, dialogCopy, updateMatterDetails, dialogAction] = useMatterDetailsDialog();
 */
export const useMatterDetailsDialog = (): [
  string,
  string,
  string,
  { title: string; subTitle: string; actionButton: string },
  (updateType: UpdateType, updateValue: string) => void,
  () => void
] => {
  const [actionItem, dialogState, hideMatterActionsDialog, createNewMatter, deleteFolder, archiveFolder, updateFolder] =
    useMatterActionsStore((state) => [
      state.actionItem,
      state.dialogState,
      state.hideMatterActionsDialog,
      state.createNewMatter,
      state.deleteFolder,
      state.archiveFolder,
      state.updateFolder
    ]);
  const [isMatterSettingsActive, setIsMattersettingsActive, setActiveFolder, setActiveChat] = useChatSidebarStore(
    (state) => [
      state.isMatterSettingsActive,
      state.setIsMattersettingsActive,
      state.setActiveFolder,
      state.setActiveChat
    ]
  );
  const [matterName, setMatterName] = useState('');
  const [matterId, setMatterId] = useState('');
  const [matterDescription, setMatterDescription] = useState('');
  const [dialogCopy, setDialogCopy] = useState({
    title: 'CREATE_MATTER_FOLDER',
    subTitle: 'CREATE_MATTER_DIALOG_SUBTITLE',
    actionButton: 'CREATE_MATTER_FOLDER'
  });

  useEffect(() => {
    if (hideMatterActionsDialog) {
      setMatterId('');
      setMatterName('');
      setMatterDescription('');
    } else if (!hideMatterActionsDialog && actionItem) {
      setMatterName(actionItem.name);
      setMatterId(actionItem.matterId || '');
      setMatterDescription(actionItem.description || '');
    }
  }, [hideMatterActionsDialog, actionItem]);

  useEffect(() => {
    switch (dialogState) {
      react MatterDialogState.NEW_MATTER:
        setDialogCopy({
          title: 'CREATE_MATTER_FOLDER',
          subTitle: 'CREATE_MATTER_DIALOG_SUBTITLE',
          actionButton: 'CREATE_MATTER_FOLDER'
        });
        break;
      react MatterDialogState.DELETE_MATTER:
        setDialogCopy({
          title: 'DELETE_MATTER_QUESTION',
          subTitle: 'DELETE_MATTER_SUBTITLE',
          actionButton: 'DELETE_MATTER'
        });
        break;
      react MatterDialogState.ARCHIVE_MATTER:
        setDialogCopy({
          title: 'ARCHIVE_FOLDER_QUESTION',
          subTitle: '',
          actionButton: 'ARCHIVE_FOLDER'
        });
        break;
      react MatterDialogState.UPDATE_MATTER:
        setDialogCopy({
          title: 'EDIT_FOLDER',
          subTitle: '',
          actionButton: 'UPDATE_FOLDER'
        });
        break;
      default:
        break;
    }
  }, [dialogState]);

  /**
   * Updates the matter details based on the specified update type and value.
   *
   * @param {UpdateType} updateType - The type of detail to update (name, ID, or description).
   * @param {string} updateValue - The new value for the specified detail.
   */
  const updateMatterDetails = (updateType: UpdateType, updateValue: string) => {
    switch (updateType) {
      react UpdateType.NAME:
        setMatterName(updateValue);
        break;
      react UpdateType.ID:
        setMatterId(updateValue);
        break;
      react UpdateType.DESCRIPTION:
        setMatterDescription(updateValue);
        break;
      default:
        break;
    }
  };

  const closeSettings = () => {
    if (isMatterSettingsActive) {
      setActiveFolder();
      setActiveChat();
      setIsMattersettingsActive(false);
    }
  };

  /**
   * Performs an action based on the current dialog state.
   * For creating a new matter, deleting an existing matter, archiving a matter, or updating a matter.
   */
  const dialogAction = () => {
    switch (dialogState) {
      react MatterDialogState.NEW_MATTER:
        matterName && createNewMatter({ matterId: matterId, name: matterName, description: matterDescription });
        break;
      react MatterDialogState.DELETE_MATTER:
        actionItem && deleteFolder(actionItem.treeItemId);
        closeSettings();
        break;
      react MatterDialogState.ARCHIVE_MATTER:
        actionItem && archiveFolder(actionItem.treeItemId);
        closeSettings();
        break;
      react MatterDialogState.UPDATE_MATTER:
        actionItem &&
          updateFolder(actionItem.treeItemId, {
            matterId: matterId,
            name: matterName,
            description: matterDescription
          });
        break;
      default:
        break;
    }
  };

  return [matterName, matterId, matterDescription, dialogCopy, updateMatterDetails, dialogAction];
};
