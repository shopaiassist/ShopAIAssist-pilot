import axios from 'axios';
import { act, fireEvent, renderWithI18n, snapshot, waitFor } from '../../../jest-utils';
import { TreeItem } from '../../@types/sidebar';
import { ChatDialogState, useModalState } from '../../store/useModalStore';
import ChatActionsDialog from './ChatActionsDialog';
import { mockTree } from '../../utils/test-utils/mockData';

const getMockedComponent = () => {
  return <ChatActionsDialog />;
};

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedChat: TreeItem = {
  treeItemId: 'fake-chat-id',
  name: 'fakeChat',
  createdAt: new Date(),
  updatedAt: new Date(),
  type: 'chat',
  fileCollectionId: 'whatever'
};

describe('ChatActionsDialog Tests', () => {
  const store = useModalState.getState();

  beforeEach(() => {
    useModalState.setState(store, true);
    jest.clearAllMocks();
  });

  describe('render', () => {
    it('should render update chat name', async () => {
      store.setActionItem(mockedChat);
      store.setModalState(ChatDialogState.UPDATE_CHAT);
      store.toggleModal();
      snapshot(getMockedComponent());
    });
    it('should render delete chat', async () => {
      store.setActionItem(mockedChat);
      store.setModalState(ChatDialogState.DELETE_CHAT);
      store.toggleModal();
      snapshot(getMockedComponent());
    });
  });

  describe('user action', () => {
    it('should call to delete a chat', async () => {
      store.setActionItem(mockedChat);
      store.setModalState(ChatDialogState.DELETE_CHAT);
      store.toggleModal();
      mockedAxios.get.mockResolvedValue(mockTree);
      mockedAxios.delete.mockResolvedValue({ status: 200 });
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);

      const confirm = wrapper.getByTestId('chat-dialog-action');
      confirm.click();

      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockedAxios.delete).toHaveBeenCalledWith('jest-test-domain/api/chats', {
        data: { id: mockedChat.treeItemId }
      });
    });

    it('should call to update a matter', async () => {
      store.setActionItem(mockedChat);
      store.setModalState(ChatDialogState.UPDATE_CHAT);
      store.toggleModal();
      mockedAxios.get.mockResolvedValue(mockTree);
      mockedAxios.patch.mockResolvedValue({ status: 200 });
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);
      const confirm = wrapper.getByTestId('chat-dialog-action');
      expect(confirm).not.toBeDisabled();

      const nameField = wrapper.getByTestId('chat-name-field');
      expect(nameField).not.toBeDisabled();
      fireEvent.input(nameField, { target: { value: '' } });
      expect(confirm).toBeDisabled();
      fireEvent.input(nameField, { target: { value: 'Changed Name' } });

      confirm.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(mockedAxios.patch).toHaveBeenCalledWith('jest-test-domain/api/chats', {
        id: mockedChat.treeItemId,
        updates: { name: 'Changed Name' }
      });
    });

    it('should close when user clicks cancel', async () => {
      store.setActionItem(mockedChat);
      store.setModalState(ChatDialogState.DELETE_CHAT);
      store.toggleModal();
      const component = getMockedComponent();
      const wrapper = renderWithI18n(component);
      const confirm = wrapper.getByTestId('chat-dialog-cancel');
      confirm.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      expect(store.hideModal).toBe(true);
    });
  });
});
