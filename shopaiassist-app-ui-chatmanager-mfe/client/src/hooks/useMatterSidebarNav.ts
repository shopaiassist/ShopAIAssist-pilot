import { SortOptions, useChatSidebarStore } from '../store/useChatSidebarStore';

/**
 * Custom hook to manage the navigation actions for the Matter sidebar.
 *
 * This hook provides a function to navigate back to the main view, resetting the active folder
 * and setting the sort type to "BY_DATE".
 *
 * @returns {[() => void]} A tuple containing:
 *          - {() => void} navigateBack: Function to navigate back to the main view.
 *
 * @example
 * const [navigateBack] = useMatterSidebarNav();
 *
 * // Use the hook's returned function in your component
 * <button onClick={navigateBack}>Back to Main View</button>
 */
const useMatterSidebarNav = (): [() => void] => {
  const [activeFolder, archivedMattersView, setActiveFolder, setSortType, toggleArchivedMattersViews] =
    useChatSidebarStore((state) => [
      state.activeFolder,
      state.archivedMattersView,
      state.setActiveFolder,
      state.setSortType,
      state.toggleArchivedMattersView
    ]);

  /**
   * Navigates back to the main view.
   * Resets the active folder and sets the sort type to "BY_DATE".
   */
  const navigateBack = () => {
    if (archivedMattersView && !activeFolder) {
      toggleArchivedMattersViews();
    }

    setSortType(SortOptions.BY_DATE);
    setActiveFolder(undefined);
    setSortType(SortOptions.BY_DATE);
  };

  return [navigateBack];
};

export default useMatterSidebarNav;
