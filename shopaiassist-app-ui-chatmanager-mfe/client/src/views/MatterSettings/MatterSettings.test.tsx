import axios from 'axios';
import { act, fireEvent, renderWithI18n, snapshot, waitFor } from '../../../jest-utils';
import { useChatSidebarStore } from '../../store/useChatSidebarStore';
import MatterSettings from './MatterSettings';
import { mockTree } from '../../utils/test-utils/mockData';
import { FolderItem } from '../../@types/sidebar';

const getMockedComponent = () => {
  return <MatterSettings />;
};

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedMatter: FolderItem = {
  treeItemId: 'fake-item-id',
  name: 'fakeMatter',
  createdAt: new Date(),
  updatedAt: new Date(),
  type: 'folder',
  description: 'This is a fake matter',
  matterId: 'fake-custom-matter-id',
  fileCollectionId: '1234'
};

describe.only('MatterSettings Tests', () => {
  const store = useChatSidebarStore.getState();

  beforeEach(() => {
    useChatSidebarStore.setState(store, true);
    store.setActiveFolder(mockedMatter);
    jest.clearAllMocks();
  });

  describe('render', () => {
    it('should render', () => {
      snapshot(getMockedComponent());
    });
  });

  describe('user action', () => {
    it('should call to update a matter', async () => {
      store.setActiveFolder(mockedMatter);
      store.setIsMattersettingsActive(true);
      mockedAxios.get.mockResolvedValue(mockTree);
      mockedAxios.patch.mockResolvedValue({ status: 200 });
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);

      const nameField = wrapper.getByTestId('matter-settings-name-field');
      expect(nameField).not.toBeDisabled();
      fireEvent.input(nameField, { target: { value: 'Changed Name' } });

      const descField = wrapper.getByTestId('matter-settings-description-field');
      expect(descField).not.toBeDisabled();
      fireEvent.input(descField, { target: { value: 'Changed Description' } });

      const matterIdField = wrapper.getByTestId('matter-settings-id-field');
      expect(matterIdField).not.toBeDisabled();
      fireEvent.input(matterIdField, { target: { value: 'Changed Matter ID' } });

      const updateButton = wrapper.getByTestId('matter-settings-update');
      expect(updateButton).not.toBeDisabled();
      updateButton.click();

      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockedAxios.patch).toHaveBeenCalledWith('jest-test-domain/api/folders', {
        id: mockedMatter.treeItemId,
        updates: { description: 'Changed Description', matterId: 'Changed Matter ID', name: 'Changed Name' }
      });
    });
  });
});
