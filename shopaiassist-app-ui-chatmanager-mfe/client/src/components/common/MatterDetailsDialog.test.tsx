import axios from 'axios';
import { act, fireEvent, renderWithI18n, snapshot, waitFor } from '../../../jest-utils';
import { MatterDialogState, useMatterActionsStore } from '../../store/useMatterActionsStore';
import MatterDetailsDialog from './MatterDetailsDialog';
import { mockTree } from '../../utils/test-utils/mockData';
import { FolderItem } from '../../@types/sidebar';

const getMockedComponent = () => {
  return <MatterDetailsDialog />;
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
  fileCollectionId: 'whatever'
};

describe('MatterDetailsDialog Tests', () => {
  const store = useMatterActionsStore.getState();

  beforeEach(() => {
    useMatterActionsStore.setState(store, true);
    jest.clearAllMocks();
  });

  describe('render', () => {
    it('should render new matter', async () => {
      store.toggleMatterDialog(MatterDialogState.NEW_MATTER);
      snapshot(getMockedComponent());
    });
    it('should render delete matter', async () => {
      store.toggleMatterDialog(MatterDialogState.DELETE_MATTER, mockedMatter);
      snapshot(getMockedComponent());
    });
    it('should render archive matter', async () => {
      store.toggleMatterDialog(MatterDialogState.ARCHIVE_MATTER, mockedMatter);
      snapshot(getMockedComponent());
    });
  });

  describe('user action', () => {
    it('should call to create a new matter', async () => {
      store.toggleMatterDialog(MatterDialogState.NEW_MATTER);
      mockedAxios.get.mockResolvedValue(mockTree);
      mockedAxios.post.mockResolvedValue({ status: 201, data: { newFolder: mockedMatter } });
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);
      const confirm = wrapper.getByTestId('matter-dialog-confirm');
      expect(confirm).toBeDisabled();

      const nameField = wrapper.getByTestId('matter-dialog-name-field');
      expect(nameField).not.toBeDisabled();
      fireEvent.input(nameField, { target: { value: 'new name folder 1' } });
      expect(confirm).not.toBeDisabled();

      const descField = wrapper.getByTestId('matter-dialog-description-field');
      expect(descField).not.toBeDisabled();
      fireEvent.input(descField, { target: { value: 'new description folder 1' } });

      const matterIdField = wrapper.getByTestId('matter-dialog-id-field');
      expect(matterIdField).not.toBeDisabled();
      fireEvent.input(matterIdField, { target: { value: 'new matter id folder 1' } });

      confirm.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockedAxios.post).toHaveBeenCalledWith('jest-test-domain/api/folders', {
        name: 'new name folder 1',
        description: 'new description folder 1',
        matterId: 'new matter id folder 1'
      });
    });

    it('should call to delete a matter', async () => {
      store.toggleMatterDialog(MatterDialogState.DELETE_MATTER, mockedMatter);
      mockedAxios.get.mockResolvedValue(mockTree);
      mockedAxios.delete.mockResolvedValue({ status: 200 });
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);

      const nameField = wrapper.getByTestId('matter-dialog-name-field');
      expect(nameField).toBeDisabled();

      const descField = wrapper.getByTestId('matter-dialog-description-field');
      expect(descField).toBeDisabled();

      const matterIdField = wrapper.getByTestId('matter-dialog-id-field');
      expect(matterIdField).toBeDisabled();

      const confirm = wrapper.getByTestId('matter-dialog-confirm');
      confirm.click();

      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockedAxios.delete).toHaveBeenCalledWith('jest-test-domain/api/folders', {
        data: { id: mockedMatter.treeItemId }
      });
    });

    it('should call to archive a matter', async () => {
      store.toggleMatterDialog(MatterDialogState.ARCHIVE_MATTER, mockedMatter);
      mockedAxios.get.mockResolvedValue(mockTree);
      mockedAxios.patch.mockResolvedValue({ status: 200 });
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);

      const nameField = wrapper.getByTestId('matter-dialog-name-field');
      expect(nameField).toBeDisabled();

      const descField = wrapper.getByTestId('matter-dialog-description-field');
      expect(descField).toBeDisabled();

      const matterIdField = wrapper.getByTestId('matter-dialog-id-field');
      expect(matterIdField).toBeDisabled();

      const confirm = wrapper.getByTestId('matter-dialog-confirm');
      confirm.click();

      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockedAxios.patch).toHaveBeenCalledWith('jest-test-domain/api/folders', {
        id: mockedMatter.treeItemId,
        updates: { isArchived: true }
      });
    });

    it('should call to update a matter', async () => {
      store.toggleMatterDialog(MatterDialogState.UPDATE_MATTER, mockedMatter);
      mockedAxios.get.mockResolvedValue(mockTree);
      mockedAxios.patch.mockResolvedValue({ status: 200 });
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);
      const confirm = wrapper.getByTestId('matter-dialog-confirm');
      expect(confirm).not.toBeDisabled();

      const nameField = wrapper.getByTestId('matter-dialog-name-field');
      expect(nameField).not.toBeDisabled();
      fireEvent.input(nameField, { target: { value: 'Changed Name' } });

      const descField = wrapper.getByTestId('matter-dialog-description-field');
      expect(descField).not.toBeDisabled();
      fireEvent.input(descField, { target: { value: 'Changed Description' } });

      const matterIdField = wrapper.getByTestId('matter-dialog-id-field');
      expect(matterIdField).not.toBeDisabled();
      fireEvent.input(matterIdField, { target: { value: 'Changed Matter ID' } });

      confirm.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockedAxios.patch).toHaveBeenCalledWith('jest-test-domain/api/folders', {
        id: mockedMatter.treeItemId,
        updates: { description: 'Changed Description', matterId: 'Changed Matter ID', name: 'Changed Name' }
      });
    });

    it('should close when user clicks cancel', async () => {
      store.toggleMatterDialog(MatterDialogState.NEW_MATTER);
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);
      const confirm = wrapper.getByTestId('matter-dialog-close');
      confirm.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(store.hideMatterActionsDialog).toBe(true);
    });
  });
});
