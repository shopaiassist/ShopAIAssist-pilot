import { Icon, MenuItem } from '@on/core-components/react';
import Translate from '../i18n/Translate';

import './MenuItem.scss';

interface MenuItemProps {
  option: {
    name: string;
    icon: string;
    action: () => void;
  };
  lastItem: boolean;
  dataTestId?: string;
}

/**
 * Properties definition for the MenuItem component.
 * @typedef {Object} MenuItemProps
 * @property {Object} option - The details of the menu item.
 * @property {string} option.name - The text key for the translation of the menu item's name.
 * @property {string} option.icon - The icon name to be displayed alongside the menu item text.
 * @property {() => void} option.action - The callback function that is executed when the menu item is clicked.
 * @property {boolean} lastItem - Indicates if this menu item is the last one in the list, which may affect styling such as adding a divider.
 * @property {string} [dataTestId] - Optional. The test ID for the menu item, used in testing.
 */

/**
 * A component that renders a single item in a menu. It includes optional styling for the last item in a menu list,
 * which can include a visual divider. It utilizes an icon and a translated label, both of which are defined in the
 * `option` object. This component is typically used within a larger menu component.
 *
 * @param {MenuItemProps} props - The properties passed to the MenuItem component.
 * @param {Object} option - The details of the menu item.
 * @param {boolean} lastItem - Indicates if this menu item is the last one in the list, which may affect styling such as adding a divider.
 * @param {string} [dataTestId] - Optional. The test ID for the menu item, used in testing.
 * @returns {JSX.Element} A rendered menu item element with an icon, translated text, and an optional divider if it is the last item.
 */
const MenuItem = ({ option, lastItem, dataTestId }: MenuItemProps) => {
  return (
    <div className="menu-item">
      {/* {lastItem && <hr className="chat-or-folder-saf-menu-divider" />} */}
      <MenuItem
        data-testid={dataTestId}
        onClick={option.action}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            option.action();
          }
        }}
      >
        <div className="chat-or-folder-saf-menu-item">
          <Icon iconName={option.icon} />
          <Translate tKey={option.name} />
        </div>
      </MenuItem>
    </div>
  );
};

export default MenuItem;
