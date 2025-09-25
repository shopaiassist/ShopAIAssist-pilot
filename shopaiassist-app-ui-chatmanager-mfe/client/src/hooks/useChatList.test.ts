import { act, renderHook, waitFor } from '@testing-library/react';
import { useChatList } from './useChatList';
import { mockTree } from '../utils/test-utils/mockData';
import { sortFoldersAndChats } from '../utils/folders';
import axios from 'axios';

jest.mock('axios');
const mockTreeData = mockTree;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useChatList Tests', () => {
  it('should return sorted list, active chat/folder, and update active chat/folder', async () => {
    mockedAxios.get.mockResolvedValue({});
    const { result } = renderHook(() => useChatList(mockTreeData));
    expect(result.current[0]).toStrictEqual(sortFoldersAndChats(mockTreeData));
    expect(result.current[1]).toBe(undefined);
    act(() => result.current[2](mockTreeData[1]));
    await waitFor(() => expect(result.current[1]).toBe(mockTreeData[1]));
  });
});
