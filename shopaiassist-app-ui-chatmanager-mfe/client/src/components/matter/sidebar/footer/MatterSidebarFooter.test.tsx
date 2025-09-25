import { act, renderWithI18n, snapshot, waitFor } from '../../../../../jest-utils';
import { FolderItem } from '../../../../@types/sidebar';
import MatterSidebarFooter from './MatterSidebarFooter';

describe('MatterSidebarFooter Tests', () => {
  const mockedChat: FolderItem = {
    treeItemId: 'fake-chat-id',
    name: 'fakeChat',
    createdAt: new Date(),
    updatedAt: new Date(),
    type: 'chat',
    fileCollectionId: 'whatever',
    matterId: 'fake-matter-id',
    description: 'fake-description',
    isArchived: false
  };

  const getMockedComponent = (
    mockOpenMatterSetting: () => void,
    mockOpenMatterFiles: () => void,
    mockToggleArchivedMattersView: () => void,
    mockedActiveFolder?: FolderItem,
    mockedArchivedMattersView: boolean = true
  ) => {
    return (
      <MatterSidebarFooter
        onOpenSettings={mockOpenMatterSetting}
        onOpenMatterFiles={mockOpenMatterFiles}
        toggleArchivedMattersView={mockToggleArchivedMattersView}
        archivedMattersView={mockedArchivedMattersView}
        activeFolder={mockedActiveFolder}
      />
    );
  };

  describe('render', () => {
    it('should render', async () => {
      snapshot(
        getMockedComponent(
          () => {},
          () => {},
          () => {}
        )
      );
    });
  });

  describe('user actions', () => {
    const mockOpenMatterSetting = jest.fn();
    const mockOpenMatterFiles = jest.fn();
    const mockToggleArchivedMattersView = jest.fn();

    it('should open call to open matter settings', async () => {
      const component = getMockedComponent(
        mockOpenMatterSetting,
        () => {},
        () => {},
        mockedChat
      );
      const wrapper = renderWithI18n(component);
      const matterSettingsButton = await wrapper.getByTestId('matter-settings-button');
      matterSettingsButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockOpenMatterSetting).toHaveBeenCalled();
    });

    it('should open call to open matter files', async () => {
      const component = getMockedComponent(
        () => {},
        mockOpenMatterFiles,
        () => {},
        mockedChat
      );
      const wrapper = renderWithI18n(component);
      const matterFilesButton = await wrapper.getByTestId('matter-files-button');
      matterFilesButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockOpenMatterFiles).toHaveBeenCalled();
    });

    it('should open call to archived matters', async () => {
      const component = getMockedComponent(
        () => {},
        () => {},
        mockToggleArchivedMattersView,
        undefined,
        false
      );
      const wrapper = renderWithI18n(component);
      const matterFilesButton = await wrapper.getByTestId('archived-matters-selectable');
      matterFilesButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockToggleArchivedMattersView).toHaveBeenCalled();
    });
  });
});
