import { useEffect } from 'react';
import { useChatSidebarStore } from '../store/useChatSidebarStore';
import { FolderItem, TreeItem } from '../@types/sidebar';
import { MfeContext } from 'react';
import { UserProfile } from 'react/dist/types/auth';
import { useMfeContextUtilsStore } from '../store/useMfeContextUtilsStore';
import { useBreadCrumbStore } from '../store/useBreadcrumbStore';
import { BreadcrumbItem } from '@reacttext/prometheus';

/**
 * Custom React hook to manage the main view of a chat and folder interface.
 * This hook integrates with a sidebar store to fetch and display a list of chats and folders,
 * and manages a UI state for showing or hiding new chat input fields.
 *
 * @param {MfeContext} context - The context for the MFE, including the user and auth context.
 * @returns {[
 *   TreeItem | undefined,
 *   FolderItem | undefined,
 *   (TreeItem | FolderItem)[] | undefined,
 *   BreadcrumbItem[],
 *   boolean | undefined,
 *   boolean,
 *   () => Promise<string>,
 *   (newActiveChat?: TreeItem | undefined) => void
 * ]} - Returns a tuple containing:
 *   - The currently active chat.
 *   - The currently active folder.
 *   - A list of chats and folders retrieved from the sidebar store.
 *   - A list of breadcrumb items.
 *   - A boolean indicating if matter settings are active.
 *   - A boolean indicating if matter files are active.
 *   - A function to create a persistent chat.
 *   - A function to set the active chat.
 *
 * @example
 * const [
 *   activeChat,
 *   activeFolder,
 *   chatsAndFolders,
 *   breadcrumbs,
 *   isMatterSettingsActive,
 *   isMatterFilesActive,
 *   createPersistentChat,
 *   setActiveChat
 * ] = useMainView(context);
 */
const useMainView = (
  context: MfeContext
): [
  TreeItem | undefined,
  FolderItem | undefined,
  (TreeItem | FolderItem)[] | undefined,
  BreadcrumbItem[],
  boolean | undefined,
  boolean,
  () => Promise<string>,
  (newActiveChat?: TreeItem | undefined) => void
] => {
  const [
    activeChat,
    chatsAndFolders,
    activeFolder,
    isMatterSettingsActive,
    isMatterFilesActive,
    createChat,
    fetchChatList,
    setUserAuth,
    setActiveChat,
    setIsMatterFilesActive
  ] = useChatSidebarStore((state) => [
    state.activeChat,
    state.chatsAndFolders,
    state.activeFolder,
    state.isMatterSettingsActive,
    state.isMatterFilesActive,
    state.createChat,
    state.fetchChatList,
    state.setUserAuth,
    state.setActiveChat,
    state.setIsMatterFilesActive
  ]);
  const [setMfeUtils] = useMfeContextUtilsStore((state) => [state.setMfeUtils]);
  const breadcrumbState = useBreadCrumbStore();
  const [setActiveUser] = useChatSidebarStore((state) => [state.setActiveUser]);

  useEffect(() => {
    fetchChatList(); // Fetch the initial list of chats and folders when the component mounts.
    const fetchUserAuthToken = async () => {
      setUserAuth(await context.getAuthToken());
    };
    setMfeUtils(context.utilities);
    fetchUserAuthToken();
    setActiveUser({ ...context.user, id: context.user.userGuid, username: context.user?.userGuid } as UserProfile);
  }, [context, fetchChatList, setUserAuth]);

  useEffect(() => {
    if (!activeFolder && isMatterFilesActive) {
      setIsMatterFilesActive(false);
    }
  }, [activeFolder]);

  /**
   * Called when a new chat was being shown on the page and the user submitted a message to make the chat 'real.'
   * @returns {Promise<string>} The ID of the created chat.
   */
  const createPersistentChat = async (): Promise<string> => {
    const title = sessionStorage.getItem('chat_title');
    if (title){
        sessionStorage.removeItem('chat_title');
        return await createChat(title, activeFolder?.treeItemId);
    }
    return createPersistentChat();
  };

  return [
    activeChat,
    activeFolder,
    chatsAndFolders,
    breadcrumbState.breadcrumbs,
    isMatterSettingsActive,
    isMatterFilesActive,
    createPersistentChat,
    setActiveChat
  ];
};

export default useMainView;
