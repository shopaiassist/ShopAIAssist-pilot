import React from 'react';
import { renderWithI18n, snapshot, waitFor } from '../../../../../jest-utils';
import MatterSidebarHeader from './MatterSidebarHeader';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import { mockTree } from '../../../../utils/test-utils/mockData';

const getMockedComponent = (opts: { mockOnNewChat: () => void }) => {
  return <MatterSidebarHeader onNewChat={opts.mockOnNewChat} />;
};

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MatterSidebarHeader Tests', () => {
  const mockOnNewChat = jest.fn();

  const sortOptionTests = async (sortOption: string) => {
    const component = getMockedComponent({ mockOnNewChat });
    const wrapper = renderWithI18n(component);
    const sortOptionsButton = await wrapper.getByTestId('sort-option-button');
    sortOptionsButton.click();
    await act(() => waitFor(() => wrapper.rerender(component)));
    const sortOptionSelect = await wrapper.getByTestId(`sort-option-menu-${sortOption}`);
    sortOptionSelect.click();
    await act(() => waitFor(() => wrapper.rerender(component)));
    expect(mockedAxios.get).toHaveBeenCalledWith('jest-test-domain/api/list', { params: { sortType: sortOption } });
    const sortMenu = await wrapper.queryAllByTestId('sort-option-menu');
    expect(sortMenu).toEqual([]);
  };

  describe('render', () => {
    it('should render', async () => {
      snapshot(getMockedComponent({ mockOnNewChat }));
    });
  });

  describe('user actions', () => {
    it('should open menu for new chat/folder', async () => {
      const component = getMockedComponent({ mockOnNewChat });
      const wrapper = renderWithI18n(component);
      const newChatButton = await wrapper.getByTestId('new-chat-button');
      newChatButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      const newChatMenu = await wrapper.getByTestId('new-folder-or-chat-menu');
      expect(newChatMenu).toBeVisible();
    });

    it('should open menu for sort options', async () => {
      const component = getMockedComponent({ mockOnNewChat });
      const wrapper = renderWithI18n(component);
      const sortOptionsButton = await wrapper.getByTestId('sort-option-button');
      sortOptionsButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));
      const sortMenu = await wrapper.getByTestId('sort-option-menu');
      expect(sortMenu).toBeVisible();
    });

    for (const sortOption of ['by_date', 'by_type', 'by_name']) {
      it(`should call function to change sort option (${sortOption})`, async () => {
        mockedAxios.get.mockResolvedValue(mockTree);
        await sortOptionTests(sortOption);
      });
    }
  });
});
