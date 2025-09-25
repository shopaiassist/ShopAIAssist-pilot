import { useState, useEffect } from 'react';
import { MatterDialogState, useMatterActionsStore } from '../store/useMatterActionsStore';
import { UpdateType } from './useMatterDetailsDialog';
import { useChatSidebarStore } from '../store/useChatSidebarStore';
import { FolderItem } from '../@types/sidebar';

/**
 * Custom hook to manage matter settings section state and actions.
 *
 * This hook provides state management for matter name, ID, and description,
 * and includes functions to update these details and perform an action to update, archive or delete.
 *
 * @returns {[FolderItem, string, string, string, function, function, function, function]} - Returns the matter name, ID, description,
 * update function, delete action function, update action function, and archive action function.
 *
 * @example
 * const [matterName, matterId, matterDescription, updateMatterDetails, onDeleteMatter, onUpdateMatter, onArchiveMatter] = useMatterSettings();
 *
 */
export const useMatterSettings = (): [
  FolderItem,
  string,
  string,
  string,
  (updateType: UpdateType, updateValue: string) => void,
  () => void,
  () => void,
  () => void,
  () => void
] => {
  const [activeFolder] = useChatSidebarStore((state) => [state.activeFolder]);

  if (!activeFolder) {
    throw new Error();
  }

  const [toggleMatterDialog, updateFolder, unarchiveFolder] = useMatterActionsStore((state) => [
    state.toggleMatterDialog,
    state.updateFolder,
    state.unarchiveFolder
  ]);

  const [matterName, setMatterName] = useState(activeFolder?.name || '');
  const [matterId, setMatterId] = useState(activeFolder?.matterId || '');
  const [matterDescription, setMatterDescription] = useState(activeFolder?.description || '');

  useEffect(() => {
    if (activeFolder) {
      setMatterName(activeFolder.name);
      setMatterId(activeFolder.matterId || '');
      setMatterDescription(activeFolder.description || '');
    }
  }, [activeFolder]);

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

  /**
   * Updates the matter to db.
   */
  const onUpdateMatter = () => {
    if (!activeFolder) return;

    updateFolder(activeFolder.treeItemId, {
      matterId: matterId,
      name: matterName,
      description: matterDescription
    });
  };

  /**
   * Triggers confirmation dialog on archive state
   */
  const onArchiveMatter = () => {
    toggleMatterDialog(MatterDialogState.ARCHIVE_MATTER, activeFolder);
  };

  /**
   * Triggers un archive matter
   */
  const onUnarchiveMatter = () => {
    unarchiveFolder(activeFolder?.treeItemId);
  };

  /**
   * Triggers confirmation dialog on delete state
   */
  const onDeleteMatter = () => {
    toggleMatterDialog(MatterDialogState.DELETE_MATTER, activeFolder);
  };

  return [
    activeFolder,
    matterName,
    matterId,
    matterDescription,
    updateMatterDetails,
    onDeleteMatter,
    onUpdateMatter,
    onArchiveMatter,
    onUnarchiveMatter
  ];
};
