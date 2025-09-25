import { act, renderWithI18n, snapshot, waitFor } from '../../../../../jest-utils';
import { FolderItem, TreeItem } from '../../../../@types/sidebar';
import { mockTree } from '../../../../utils/test-utils/mockData';
import ChatOrFolderItem from './ChatOrFolderItem';
import { useModalState } from '../../../../store/useModalStore';
import { MatterDialogState, useMatterActionsStore } from '../../../../store/useMatterActionsStore';
import { useChatSidebarStore } from '../../../../store/useChatSidebarStore';

const mockTreeData = mockTree;

const getMockedComponent = (opts: {
  mockOnSelect: (item?: TreeItem | FolderItem) => void;
  mockTreeItem: TreeItem | FolderItem;
}) => {
  return <ChatOrFolderItem treeItem={opts.mockTreeItem} onSelect={opts?.mockOnSelect} />;
};

describe('ChatOrFolderItem Tests', () => {
  const chatSidebarStore = useChatSidebarStore.getState();
  const modalStore = useModalState.getState();
  const matterActionStore = useMatterActionsStore.getState();

  beforeEach(() => {
    useChatSidebarStore.setState(chatSidebarStore, true);
    useModalState.setState(modalStore, true);
    useMatterActionsStore.setState(matterActionStore, true);
  });

  describe('render', () => {
    it('should render', async () => {
      snapshot(getMockedComponent({ mockOnSelect: () => {}, mockTreeItem: mockTreeData[0] }));
    });
  });

  describe('user actions', () => {
    const mockOnSelect = jest.fn();

    const folderActions = async (action: MatterDialogState) => {
      useChatSidebarStore.setState({ chatsAndFolders: [mockTreeData[0]] });
      let buttonDataTestId = '';
      switch (action) {
        react MatterDialogState.ARCHIVE_MATTER:
          buttonDataTestId = 'folder-menu-item-ARCHIVE_FOLDER';
          break;
        react MatterDialogState.DELETE_MATTER:
          buttonDataTestId = 'folder-menu-item-DELETE_MATTER';
          break;
        react MatterDialogState.UPDATE_MATTER:
          buttonDataTestId = 'folder-menu-item-EDIT_FOLDER';
          break;
        default:
          break;
      }
      const component = getMockedComponent({ mockOnSelect, mockTreeItem: mockTreeData[0] });
      const wrapper = renderWithI18n(component);
      const chatOrFolderItemOptionMenuButton = wrapper.getByTestId(
        `${mockTreeData[0].type}-${mockTreeData[0].treeItemId}-option-menu`
      );
      chatOrFolderItemOptionMenuButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      const chatOrFolderItemOpenMenu = wrapper.getByTestId('chat-or-folder-saf-menu');
      expect(chatOrFolderItemOpenMenu).toBeVisible();
      await act(() => waitFor(() => wrapper.rerender(component)));
      const chatDeleteOption = wrapper.getByTestId(buttonDataTestId);
      chatDeleteOption.click();
      expect(useMatterActionsStore.getState().actionItem).toBe(mockTreeData[0]);
      expect(useMatterActionsStore.getState().dialogState).toBe(action);
    };

    it('should call select function when list item is clicked', async () => {
      const component = getMockedComponent({ mockOnSelect, mockTreeItem: mockTreeData[0] });
      const wrapper = renderWithI18n(component);
      const chatOrFolderItem = wrapper.getByTestId(`${mockTreeData[0].type}-${mockTreeData[0].treeItemId}-selectable`);
      chatOrFolderItem.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockOnSelect).toHaveBeenCalledWith(mockTreeData[0]);
    });

    it('should open options menu when list item is clicked', async () => {
      const component = getMockedComponent({ mockOnSelect, mockTreeItem: mockTreeData[0] });
      const wrapper = renderWithI18n(component);
      const chatOrFolderItemOptionMenuButton = wrapper.getByTestId(
        `${mockTreeData[0].type}-${mockTreeData[0].treeItemId}-option-menu`
      );
      chatOrFolderItemOptionMenuButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      const chatOrFolderItemOpenMenu = wrapper.getByTestId('chat-or-folder-saf-menu');
      expect(chatOrFolderItemOpenMenu).toBeVisible();
    });

    it('should open options and call to delete chat', async () => {
      useChatSidebarStore.setState({ chatsAndFolders: [mockTreeData[3]] });
      const component = getMockedComponent({ mockOnSelect, mockTreeItem: mockTreeData[3] });
      const wrapper = renderWithI18n(component);
      const chatOrFolderItemOptionMenuButton = wrapper.getByTestId(
        `${mockTreeData[3].type}-${mockTreeData[3].treeItemId}-option-menu`
      );
      chatOrFolderItemOptionMenuButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      const chatOrFolderItemOpenMenu = wrapper.getByTestId('chat-or-folder-saf-menu');
      expect(chatOrFolderItemOpenMenu).toBeVisible();
      await act(() => waitFor(() => wrapper.rerender(component)));
      const chatDeleteOption = wrapper.getByTestId('chat-menu-item-DELETE_CHAT');
      chatDeleteOption.click();
      expect(useModalState.getState().actionItem).toBe(mockTreeData[3]);
    });

    it('should open options and call to edit folder', async () => {
      await folderActions(MatterDialogState.UPDATE_MATTER);
    });

    it('should open options and call to archive folder', async () => {
      await folderActions(MatterDialogState.ARCHIVE_MATTER);
    });

    it('should open options and call to delete folder', async () => {
      await folderActions(MatterDialogState.DELETE_MATTER);
    });
  });
});
