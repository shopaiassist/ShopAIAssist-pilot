import React from 'react';
import MatterSidebar from './MatterSidebar';
import { act, renderWithI18n, snapshot, waitFor } from '../../../../jest-utils';
import { FolderItem } from '../../../@types/sidebar';
import { useChatSidebarStore } from '../../../store/useChatSidebarStore';

const mockCloseSidebar = jest.fn();

const getMockedComponent = () => {
  return <MatterSidebar onNewChat={() => {}} isOpen={true} closeSidebar={mockCloseSidebar} />;
};
const mockedMatter: FolderItem = {
  treeItemId: 'fake-item-id',
  name: 'fakeMatter',
  createdAt: new Date(),
  updatedAt: new Date(),
  type: 'folder',
  description: 'This is a fake matter',
  matterId: 'fake-custom-matter-id',
  fileCollectionId: 'whatever'
};

describe('MatterSidebar Tests', () => {
  const store = useChatSidebarStore.getState();

  beforeEach(() => {
    useChatSidebarStore.setState(store, true);
  });

  describe('render', () => {
    it('should render', async () => {
      snapshot(getMockedComponent());
    });
    it('should in folder view', async () => {
      useChatSidebarStore.setState({ activeFolder: mockedMatter });
      snapshot(getMockedComponent());
    });
  });

  describe('user actions', () => {
    it('should open menu for new chat/folder', async () => {
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);
      const sidebar = await wrapper.getByTestId('matter-sidebar');
      const closeButton = await wrapper.getByTestId('matter-sidebar-nav-close');
      expect(sidebar.getAttribute('is-open')).toBe('true');
      closeButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockCloseSidebar).toHaveBeenCalled();
    });
  });
});
