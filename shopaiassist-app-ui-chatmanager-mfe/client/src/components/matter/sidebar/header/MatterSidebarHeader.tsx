import { RefObject, useState } from 'react';
import { Button, Icon, MenuItem } from '@on/core-components/react';
import Translate from '../../../i18n/Translate';
import classnames from 'classnames';
import { useOutsideClick } from '../../../../hooks/useOutsideClick';
import { useSortMenu } from '../../../../hooks/useSortMenu';
import { useNewChatMenu } from '../../../../hooks/useNewChatMenu';
import { PopperMenu } from '../../../common';
import { MatterDialogState, useMatterActionsStore } from '../../../../store/useMatterActionsStore';
import useMFECommunication, { CustomEventData } from '../../../../hooks/useMFECommunication';

import './MatterSidebarHeader.scss';

interface MatterBodyHeaderProps {
  className?: string;
  isFolderView?: boolean;
  showAddChatButton?: boolean;
  onNewChat: () => void;
}

/**
 * Header component with new chat/folder and sorting capabilities.
 *
 * @param props - Component props.
 * @returns Rendered component.
 */
const MatterSidebarHeader = ({
  className,
  isFolderView,
  showAddChatButton = true,
  onNewChat
}: MatterBodyHeaderProps) => {
  const [newChatMenuState, newChatMenuToggle, newChatMenuRefElement, setNewChatMenuRef] = useNewChatMenu(false);
  const [
    sortMenuOptions,
    selectedSortOption,
    sortMenuState,
    sortMenuToggle,
    handelSortMenuItemClick,
    sortMenuRefElement,
    setMenuRefElement,
    setSortType,
    isLoading
  ] = useSortMenu(false);
  const [toggleMatterDialog] = useMatterActionsStore((state) => [state.toggleMatterDialog]);
  const [isOpenSort, setSortOpen] = useState(false);

  // Combine the two MFE communication listeners into one tp call sort left menu by date.
  const handleMFECommunication = (data: CustomEventData) => {
    if (data) {
       setSortType('by_date');
    }
  };

  useMFECommunication('isSortingMenu', handleMFECommunication);
  useMFECommunication('isChatting', handleMFECommunication);

  const sortMenuRef = useOutsideClick(() => {
    sortMenuState && sortMenuToggle();
  });
  const chatAndFolderMenuRef = useOutsideClick(() => {
    newChatMenuState && newChatMenuToggle();
  });

  return (
    <div className={classnames('matter-body-header', className)} data-testid="matter-body-header">
      {showAddChatButton && (
        <div
          className="new-folder-or-chat-button-container"
          ref={chatAndFolderMenuRef as RefObject<HTMLDivElement>}
          data-testid="new-folder-or-chat-button-container"
        >
          <Button
            appearance="primary"
            // onClick={isFolderView ? onNewChat : newChatMenuToggle}
            onClick={() => {
              onNewChat();
              newChatMenuToggle();
            }}
            data-testid="new-chat-button"
            // @ts-expect-error: The usePopper hook is designed to directly take DOM nodes instead of refs to update dynamically as nodes change. We use a callback ref and useState to support this dynamic behavior effectively.
            ref={setNewChatMenuRef}
          >
            <div className="new-folder-or-chat-button">
              <Icon iconName="plus" />
              <Translate tKey={isFolderView ? 'NEW_CHAT' : 'NEW_CHAT_OR_FOLDER_BUTTON'} />
            </div>
          </Button>
          {/* {newChatMenuState && !isFolderView && (
            <PopperMenu
              referenceElement={newChatMenuRefElement}
              className="new-folder-or-chat-menu"
              placement="bottom-start"
              strategy="fixed"
              dataTestId="new-folder-or-chat-menu"
            >
              <MenuItem
                data-testid="new-folder-or-chat-menu-item-chat"
                onClick={() => {
                  onNewChat();
                  newChatMenuToggle();
                }}
              >
                <div className="new-folder-or-chat-menu-item">
                  <Icon iconName="message-lines" />
                  <Translate tKey="NEW_CHAT" />
                </div>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  toggleMatterDialog(MatterDialogState.NEW_MATTER, undefined);
                  newChatMenuToggle();
                }}
                data-testid="new-folder-or-chat-menu-item-folder"
              >
                <div className="new-folder-or-chat-menu-item">
                  <Icon iconName="folder" />
                  <Translate tKey="NEW_FOLDER" />
                </div>
              </MenuItem>
            </PopperMenu>
          )} */}
        </div>
      )}

      <div
        className="new-folder-or-chat-button-container"
        ref={sortMenuRef as RefObject<HTMLDivElement>}
        data-testid="sort-option-container"
      >
        <Button
           id='sort-option-btn'
           appearance="tertiary"
           onClick={() => {
              sortMenuToggle()
              setSortOpen(true)
            }}
           data-testid="sort-option-button"
           aria-expanded={isOpenSort ? 'true' : 'false'}
           aria-haspopup="true"
           aria-controls="sort-option-menu"
           disabled={isLoading}
           // Add a title to explain why the button is disabled
           title={isLoading ? 'Loading chat data...' : 'Sort chats'}
          // @ts-expect-error: The usePopper hook is designed to directly take DOM nodes instead of refs to update dynamically as nodes change. We use a callback ref and useState to support this dynamic behavior effectively.
          ref={setMenuRefElement}
        >
          <div className="new-folder-or-chat-button">
            <Translate tKey={sortMenuOptions.find((option) => option.value === selectedSortOption)?.title || ''} />
            {isLoading ? (
              /* Use a static spinner icon without animation */
              <Icon iconName="spinner" />
            ) : (
              <Icon iconName="angle-down" />
            )}
          </div>
        </Button>
        {sortMenuState && (
          <PopperMenu
            className="new-folder-or-chat-menu"
            dataTestId="sort-option-menu"
            referenceElement={sortMenuRefElement}
            placement="bottom-start"
            strategy="fixed"
          >
            {sortMenuOptions.map((menuOption) => (
              <MenuItem
                onClick={() => handelSortMenuItemClick(menuOption.value, setSortType)}
                data-testid={`sort-option-menu-${menuOption.value}`}
                key={`sort-option-menu-${menuOption.value}`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handelSortMenuItemClick(menuOption.value, setSortType)
                  }
                  if (event.key === 'Tab' || event.key === 'Escape') {
                    sortMenuToggle();
                  }
                }}
              >
                <div className="new-folder-or-chat-menu-item">
                  <Translate tKey={menuOption.title} />
                </div>
              </MenuItem>
            ))}
          </PopperMenu>
        )}
      </div>
    </div>
  );
};

export default MatterSidebarHeader;
