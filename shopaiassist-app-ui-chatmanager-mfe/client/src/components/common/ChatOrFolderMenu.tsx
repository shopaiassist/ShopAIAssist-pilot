import { RefObject } from 'react';
import MenuItem from './MenuItem';
import PopperMenu from './PopperMenu';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { ItemType } from '../../@types/sidebar';
import { useChatOrFolderItem } from '../../hooks/useChatOrFolderItem';
import { Icon } from '@on/core-components/react';

import './ChatOrFolderMenu.scss';
import SelectableKebabItem from './SelectableKebabItem';

interface ChatOrFolderMenuProps {
  isOpen: boolean;
  toggleOpen: () => void;
  itemId: string;
  itemType: ItemType;
  itemName?: string;
}

/**
 * Component to display a menu for a chat or folder item.
 * The menu provides options such as edit, archive, and delete, and uses a popper for dynamic positioning.
 *
 * @param {ChatOrFolderMenuProps} props - The props for the component.
 * @returns {JSX.Element} The rendered element for the chat or folder item menu.
 */
const ChatOrFolderMenu = ({ isOpen, toggleOpen, itemId, itemType, itemName }: ChatOrFolderMenuProps) => {
  const [, , popperMenuReference, setPopperMenuReference, menuOptions] = useChatOrFolderItem(false, itemId, itemType);
  const actionsMenuRef = useOutsideClick(() => {
    isOpen && toggleOpen();
  });
  return (
    <div className="chat-or-folder-menu" ref={actionsMenuRef as RefObject<HTMLDivElement>}>
      <SelectableKebabItem
        onSelect={toggleOpen}
        isIcon={true}
        selected={isOpen}
        dataTestId={`${itemType}-${itemId}-option-menu`}
        treeItemId={itemId}
        ariaExpanded={isOpen}
        ariaLabel={`Actions for conversation ${itemName}`}
      >
        {/* @ts-expect-error: The usePopper hook is designed to directly take DOM nodes instead of refs to update dynamically as nodes change. We use a callback ref and useState to support this dynamic behavior effectively. */}
        <Icon size={24} iconName="ellipsis-vertical" ref={setPopperMenuReference} />
      </SelectableKebabItem>

      {isOpen && (
        <PopperMenu
          className="chat-or-folder-saf-menu"
          referenceElement={popperMenuReference}
          placement="bottom-start"
          strategy="fixed"
          offset={[-16, 16]}
          dataTestId="chat-or-folder-saf-menu"
        >
          {menuOptions.map((option, index) => {
            return (
              <MenuItem
                option={option}
                lastItem={index === menuOptions.length - 1}
                dataTestId={`${itemType}-menu-item-${option.name}`}
                key={`${itemType}-${itemId}-option-${index}`}
              />
            );
          })}
        </PopperMenu>
      )}
    </div>
  );
};

export default ChatOrFolderMenu;
