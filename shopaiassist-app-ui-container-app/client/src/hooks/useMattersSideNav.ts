import mattersMfeStore from '../store/mattersMfeStore';

/**
 * Custom hook to manage the state and actions for the Matters side navigation.
 *
 * This hook provides the state of the sidebar's visibility, a function to set the visibility state,
 * and a function to handle the "My Work" click event.
 *
 * @returns {[boolean, (state: boolean) => void, () => void]} A tuple containing:
 *          - {boolean} isSidebarOpen: The current visibility state of the sidebar.
 *          - {(state: boolean) => void} setIsSidebarOpen: Function to set the sidebar's visibility state.
 *          - {() => void} handleMyWorkClick: Function to handle the "My Work" click event.
 *
 * @example
 * const [isSidebarOpen, setIsSidebarOpen, handleMyWorkClick] = useMattersSideNav();
 *
 * // Use the hook's returned values in your component
 * <button onClick={handleMyWorkClick}>
 *   {isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
 * </button>
 */
const useMattersSideNav = (): [boolean, (state: boolean) => void, () => void] => {
  const [isSidebarOpen, setIsSidebarOpen] = mattersMfeStore((state) => [state.isSidebarOpen, state.setIsSidebarOpen]);

  /**
   * Handles the "My Work" click event.
   * Opens the sidebar if it is not already open.
   */
  const handleMyWorkClick = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  };

  return [isSidebarOpen, setIsSidebarOpen, handleMyWorkClick];
};

export default useMattersSideNav;
