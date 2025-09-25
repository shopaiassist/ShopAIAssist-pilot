import { Icon, Text, Tooltip } from '@on/core-components/react';
import { useChatOrFolderItem } from '../../../../hooks/useChatOrFolderItem';
import { SelectableItem, TypewriterText } from '../../../common';
import { TreeItem, FolderItem } from '../../../../@types/sidebar';
import { truncate } from 'lodash';
import { CHAT_OR_FOLDER_NAME_DISPLAY_LENGTH, TYPEWRITER_DELAY } from '../../../../utils/constatnts';

import './ChatOrFolderItem.scss';
import ChatOrFolderMenu from '../../../common/ChatOrFolderMenu';

/**
 * Props for the ChatOrFolderItem component.
 *
 * @interface ChatOrFolderItemProps
 * @property {TreeItem | FolderItem} treeItem - The chat or folder object to display.
 * @property {boolean} [selected] - Indicates whether the item is selected.
 * @property {(item?: TreeItem | FolderItem) => void} onSelect - Callback fired when the item is selected.
 */
interface ChatOrFolderItemProps {
  treeItem: TreeItem | FolderItem;
  selected?: boolean;
  onSelect: (item?: TreeItem | FolderItem) => void;
}

/**
 * Component to display a chat or folder item with context menu options.
 * It uses `SelectableItem` for selectable UI elements, and conditional rendering
 * to switch between chat and folder specific actions. Uses custom hooks for state
 * management and outside click detection.
 *
 * @param {ChatOrFolderItemProps} props - The props for the component.
 * @returns {JSX.Element} The rendered element for either a chat or a folder item.
 */
const ChatOrFolderItem = ({ treeItem, selected, onSelect }: ChatOrFolderItemProps) => {
  const [chatOrFolderItemMenuState, toggleChatOrFolderItemMenu] = useChatOrFolderItem(
    false,
    treeItem.treeItemId,
    treeItem.type
  );

  return (
    <div className="chat-or-folder-item-container">
      <>
        <SelectableItem
          selected={selected}
          onSelect={() => onSelect(treeItem || undefined)}
          dataTestId={`${treeItem?.type}-${treeItem?.treeItemId}-selectable`}
          treeItemId={treeItem.treeItemId}
        >
          <Icon
            appearance={selected ? 'solid' : 'light'}
            size={16}
            iconName={treeItem?.type === 'folder' ? 'folder' : 'message-lines'}
            className="chat-or-folder-icon"
          />
          <Text appearance="body-strong-md" id={`chat-text-${treeItem?.treeItemId}`}>
            <TypewriterText
              text={truncate(treeItem?.name, { length: CHAT_OR_FOLDER_NAME_DISPLAY_LENGTH })}
              delay={TYPEWRITER_DELAY}
            />
          </Text>
          {treeItem && treeItem?.name.length > CHAT_OR_FOLDER_NAME_DISPLAY_LENGTH ? (
            <Tooltip placement="bottom-start" anchor={`chat-text-${treeItem?.treeItemId}`}>
              {treeItem?.name}
            </Tooltip>
          ) : (
            <></>
          )}
        </SelectableItem>
        {treeItem && (
          <ChatOrFolderMenu
            isOpen={chatOrFolderItemMenuState}
            toggleOpen={toggleChatOrFolderItemMenu}
            itemId={treeItem.treeItemId}
            itemType={treeItem.type}
            itemName={treeItem.name}
          />
        )}
      </>
    </div>
  );
};
export default ChatOrFolderItem;
