import classnames from 'classnames';
import './SelectableItem.scss';
import { useChatSidebarStore } from '../../store/useChatSidebarStore';
import { useChatList } from '../../hooks/useChatList';
import { SelectableItemProps } from './SelectableItem';

interface SelectableKebabItemProps extends SelectableItemProps {
  ariaExpanded?: boolean;
  ariaLabel?: string;
}

/**
 * A  component for rendering a Kebab Menu. It extends the SelectableItem component and adds additional props for Kebab menu accessibility.
 *
 * @param {boolean} [selected=false] - Determines if the item is currently selected.
 * @param {string | JSX.Element | JSX.Element[]} children - Content to be rendered within the item.
 * @param {() => void} onSelect - Callback function that is called when the item is clicked.
 * @param  {boolean} [isIcon=false] - If true, applies styling specific to icons.
 * @returns {JSX.Element} A div element that users can interact with to select/deselect.
 */
const SelectableKebabItem = ({
  selected,
  children,
  onSelect,
  isIcon,
  dataTestId,
  className,
  treeItemId,
  ariaExpanded,
  ariaLabel
}: SelectableKebabItemProps) => {
  const [chatsAndFolders] = useChatSidebarStore((state) => [state.chatsAndFolders]);
  const treeItem = chatsAndFolders?.find((item) => item.treeItemId === treeItemId);
  const [, activeItem, updateActiveItem] = useChatList(chatsAndFolders);

  const setActiveItem = () => {
    onSelect();
    updateActiveItem(treeItem);
    selected = true;
    activeItem === treeItem;
  };

  const keyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter') {
      setActiveItem();
    }
  };

  return (
    <a
      className={classnames(
        'selectable-item',
        selected && 'selectable-item-selected',
        isIcon && 'selectable-icon',
        className ? className : ''
      )}
      onClick={setActiveItem}
      onKeyDown={keyDown}
      data-testid={dataTestId}
      tabIndex={0}
      aria-current={!!selected}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      aria-haspopup="true"
      aria-controls="chat-or-folder-saf-menu"
    >
      {children}
    </a>
  );
};

export default SelectableKebabItem;
