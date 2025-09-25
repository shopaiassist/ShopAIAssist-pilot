import classnames from 'classnames';
import './SelectableItem.scss';
import { useChatSidebarStore } from '../../store/useChatSidebarStore';
import { useChatList } from '../../hooks/useChatList';

export interface SelectableItemProps {
  selected?: boolean;
  children: string | JSX.Element | JSX.Element[];
  className?: string;
  onSelect: () => void;
  isIcon?: boolean;
  dataTestId?: string;
  treeItemId?: string;
}

/**
 * A generic component for rendering an item that can be selected. This component can be used for a variety of UI elements
 * where selectable functionality is needed, such as in lists, menus, or as standalone clickable elements.
 * It conditionally applies CSS classes based on whether the item is selected or designated as an icon.
 *
 * @param {boolean} [selected=false] - Determines if the item is currently selected.
 * @param {string | JSX.Element | JSX.Element[]} children - Content to be rendered within the item.
 * @param {() => void} onSelect - Callback function that is called when the item is clicked.
 * @param  {boolean} [isIcon=false] - If true, applies styling specific to icons.
 * @returns {JSX.Element} A div element that users can interact with to select/deselect.
 */
const SelectableItem = ({ selected, children, onSelect, isIcon, dataTestId, className, treeItemId }: SelectableItemProps) => {
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
    >
      {children}
    </a>
  );
};

export default SelectableItem;
