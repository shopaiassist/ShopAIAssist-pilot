import dayjs from 'dayjs';
import { snapshot } from '../../../../../jest-utils';
import ChatList from './ChatList';
import { mockTree } from '../../../../utils/test-utils/mockData';

const mockTreeData = mockTree;

const getMockedComponent = () => {
  return <ChatList chatsAndFolders={mockTreeData.slice(0, 5)} />;
};

describe('ChatList Tests', () => {
  describe('render', () => {
    // Run these tests as if today is 5/9/2024 so that the snapshot shows the chats grouped correctly by date.
    beforeEach(() => jest.useFakeTimers().setSystemTime(dayjs('2024-05-09T15:26:57.992Z').toDate()));
    afterEach(() => jest.useRealTimers());

    it('should render', async () => {
      snapshot(getMockedComponent());
    });
  });
});
