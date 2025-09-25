import ChatOrFolderItem from './ChatOrFolderItem';
import { useChatList } from '../../../../hooks/useChatList';

import './ChatList.scss';
import { useChatSidebarStore } from '../../../../store/useChatSidebarStore';
import { TreeItem, FolderItem } from '../../../../@types/sidebar';
import { useMatters } from '../../../../views/Context';
import { ModalType } from '../../../../App';
import useMFECommunication from '../../../../hooks/useMFECommunication';

interface ChatListProps {
  chatsAndFolders?: Array<TreeItem | FolderItem>;
  closeSidebar?: () => void;
}

/**
 * A component that renders a list of chat and folder items. It utilizes a custom hook to handle
 * the logic for sorting and selecting active items within the list.
 *
 * This component takes an optional `chatsAndFolders` array and renders a structured list
 * that groups chats and folders by a specified timeframe (if byDate sorting is selected). Each item in the list is displayed
 * using the `ChatOrFolderItem` component, which can handle selection and action management
 * for each individual item.
 *
 * @param  [chatsAndFolders] - An array containing chat or folder objects to be displayed.
 * @returns The rendered list of chat and folder items. If no items are provided,  a prompt to start adding items is displayed.
 *
 */
const ChatList = ({ chatsAndFolders, closeSidebar }: ChatListProps) => {
  const [sortedChatsAndFolders, activeItem, updateActiveItem] = useChatList(chatsAndFolders);
  const state = useChatSidebarStore();
  const { modalType } = useMatters();
  const [sendEvent] = useMFECommunication('chat_item_selected');
  return (
    <div className="chat-list-container">
      {chatsAndFolders?.length ? (
        <div className="chat-list">
          {state.sortType === 'by_date'
            ? sortedChatsAndFolders?.map((timeChunk, index) => (
                <div key={`${timeChunk.timeframe}-${index}`}>
                  <h4 className="timeframe-text">{timeChunk.timeframe}</h4>
                  {timeChunk.chats.map((treeItem) => (
                    <ChatOrFolderItem
                      treeItem={treeItem}
                      selected={activeItem?.treeItemId === treeItem.treeItemId}
                      onSelect={(item) => {
                        sendEvent({ message: 'chat_item_selected', body: activeItem });
                        updateActiveItem(item);
                        if (modalType === ModalType.Compact) {
                          closeSidebar && closeSidebar();
                        }
                      }}
                      key={`${treeItem.type}-${treeItem.treeItemId}`}
                    />
                  ))}
                </div>
              ))
            : chatsAndFolders.map((treeItem) => (
                <ChatOrFolderItem
                  treeItem={treeItem}
                  selected={activeItem?.treeItemId === treeItem.treeItemId}
                  onSelect={(item) => {
                    updateActiveItem(item);
                    if (modalType === ModalType.Compact) {
                      closeSidebar && closeSidebar();
                    }
                  }}
                  key={`${treeItem.type}-${treeItem.treeItemId}`}
                />
              ))}
        </div>
      ) : (
        <div className="empty-chat-list"> Chats will appear here</div>
      )}
    </div>
  );
};
export default ChatList;
