import React from 'react';
import { SafIcon, SafMenu, SafMenuItem, SafText, SafTooltip } from '@/core-components/react';
import classNames from 'classnames';

const ICON_SIZE = 16;

interface NavMenuItemProps {
  id: string;
  icon?: string;
  label: string;
  text?: string;
  onClick: () => void;
  showArrow?: boolean;
  hasLink?: boolean;
  url?: string;
  selected: boolean;
  disabled?: boolean;
  useTooltip?: boolean;
  bold?: boolean;
  pendoId?: string;
}

/** NavMenuItem component */
const NavMenuItem = ({
  id,
  icon,
  label,
  onClick,
  showArrow = false,
  url,
  selected,
  disabled = false,
  useTooltip = true,
  bold = false,
  pendoId,
}: NavMenuItemProps) => {
  return (
    <>
      <SafMenuItem
        id={id}
        hasLink={!!url}
        url={url}
        onClick={onClick}
        className={classNames('nav-menu-item', { selected })}
        target="_blank"
        disabled={disabled}
        data-testid={pendoId}
      >
        {!!icon && (
          <SafIcon
            slot="start"
            icon-name={icon}
            appearance={selected ? 'solid' : 'light'}
            size={ICON_SIZE}
            style={{ alignItems: 'center' }}
          />
        )}
        <div className="nav-item-content">
          <SafText appearance={bold ? 'body-strong-md' : 'body-default-md'}>{label}</SafText>
          {!!url && (
            <div style={{ position: 'absolute', right: '0.5rem' }}>
              <SafIcon icon-name="external-link" appearance="light" size={ICON_SIZE} />
            </div>
          )}
        </div>
        {showArrow && <SafMenu hidden slot="submenu" />}
      </SafMenuItem>
      {useTooltip && (
        <SafTooltip anchor={id} placement="right">
          {label}
        </SafTooltip>
      )}
    </>
  );
};

export default NavMenuItem;
