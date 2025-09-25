import { useChatSidebarStore } from '../store/useChatSidebarStore';

/**
 * Custom hook to manage the state of the Matter footer.
 *
 * This hook provides the state of whether the Matter files and settings are active.
 *
 * @returns {[boolean, boolean]} A tuple containing:
 *          - {boolean} isMatterFilesActive: The current state indicating if the Matter files are active.
 *          - {boolean} isMatterSettingsActive: The current state indicating if the Matter settings are active.
 *
 * @example
 * const [isMatterFilesActive, isMatterSettingsActive] = useMatterFooter();
 *
 * // Use the hook's returned values in your component
 * if (isMatterFilesActive) {
 *   // Matter files are active
 * }
 * if (isMatterSettingsActive) {
 *   // Matter settings are active
 * }
 */
const useMatterFooter = (): [boolean, boolean | undefined] => {
  const [isMatterFilesActive, isMatterSettingsActive] = useChatSidebarStore((state) => [
    state.isMatterFilesActive,
    state.isMatterSettingsActive
  ]);
  return [isMatterFilesActive, isMatterSettingsActive];
};
export default useMatterFooter;
