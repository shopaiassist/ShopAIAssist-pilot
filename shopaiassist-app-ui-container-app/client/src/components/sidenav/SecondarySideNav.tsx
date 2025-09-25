import React from 'react';
import { i18n, Translate } from '@/';
import { SafButton, SafIcon, SafSideNav, SafText } from '@/core-components/react';
import { useNavigate } from 'react-router-dom';

import { OLYMPUS_ROUTES } from '../../App';
import useSelectedMenuItem from '../../hooks/useSelectedMenuItem';
import { getPathName } from '../../utils/misc';
import NavMenuItem from './NavMenuItem';

import './SideNav.scss';

interface SecondarySideNavProps {
  tree: SecondarySideNavTree;
  isMobile: boolean;
  closeNav: () => void;
  toggleMainNav: (open?: boolean) => void;
}

const SecondarySideNav = ({ tree, isMobile, closeNav, toggleMainNav }: SecondarySideNavProps) => {
  const navigate = useNavigate();
  const { t } = i18n.useTranslation();

  /** Support info config */
  const SupportInfo = {
    SUPPORT_NUMBER: '8332273898',
    SUPPORT_EMAIL: 'support@.com',
    TRAINING_LINK: 'https://training.example.com/legal--core',
    HELP_ARTICLES_LINK: 'https://www.example.com/en-us/help/.html',
    SUPPORT_HOURS: {
      weekDays: {
        starting: 7,
        ending: 22,
        timezone: 'ET',
      },
      weekend: {
        starting: 8,
        ending: 17,
        timezone: 'ET',
      },
    },
  };

  /** Formats a number representing a 24hrs format hour to a string in 12hrs format */
  const formatHour = (hour: number) => {
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  /**
   * Formats a plain string representing a 10-digit phone number.
   * Example:
   *   1234567890 -> (123) 456-7890
   */
  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      number = '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return `${t('CALL')} ${number}`;
  };

  /** Toggle the OneTrust Cookie Settings display  */
  const onCookieSettingsClick = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).OneTrust?.ToggleInfoDisplay();
  };

  /** List of nav menu items to render */
  const navMenuItems: NavMenuTree = {
    manage: [
      {
        id: 'favorites-nav-item',
        label: t('FAVORITES'),
        navPath: OLYMPUS_ROUTES.MANAGE_FAVORITES,
      },
    ],
    admin: [
      {
        id: 'permissions-nav-item',
        label: t('USER_PERMISSIONS'),
        navPath: OLYMPUS_ROUTES.ADMIN_PERMISSIONS,
      },
      {
        id: 'analytics-nav-item',
        label: t('USAGE_ANALYTICS'),
        navPath: OLYMPUS_ROUTES.ADMIN_USAGE,
      },
      {
        id: 'integrations-nav-item',
        label: t('INTEGRATIONS'),
        navPath: OLYMPUS_ROUTES.ADMIN_INTEGRATIONS,
      },
    ],
    support: [
      {
        id: 'live-chat-nav-item',
        icon: 'comments',
        label: t('LIVE_CHAT'),
      },
      {
        id: 'phone-nav-item',
        label: formatPhoneNumber(SupportInfo.SUPPORT_NUMBER),
        url: `tel:${SupportInfo.SUPPORT_NUMBER}`,
      },
      {
        id: 'email-nav-item',
        label: t('EMAIL'),
        url: `mailto:${SupportInfo.SUPPORT_EMAIL}`,
      },
      {
        id: 'help-articles-nav-item',
        label: t('HELP_ARTICLES'),
        url: SupportInfo.HELP_ARTICLES_LINK,
      },
      {
        id: 'training-nav-item',
        label: t('TRAINING'),
        url: SupportInfo.TRAINING_LINK,
      },
    ],
    legal: [
      {
        id: 'terms-nav-item',
        label: t('TERMS'),
        url: 'https://www.example.com/en/terms-of-use.html',
      },
      {
        id: 'privacy-nav-item',
        label: t('PRIVACY'),
        url: 'https://www.example.com/en/privacy-statement.html',
      },
      {
        id: 'cookie-settings-nav-item',
        label: t('COOKIE_SETTINGS'),
        onClick: onCookieSettingsClick,
      },
      {
        id: 'cookie-policy-nav-item',
        label: t('COOKIE_POLICY'),
        url: 'https://www.example.com/en/privacy-statement.html#CookieIBA',
      },
      {
        id: 'do-not-sell-nav-item',
        label: t('DO_NOT_SELL'),
        url: '/redirect/ccpa-dsar',
      },
    ],
  };

  const [selectedMenuItem, setSelectedMenuItem] = useSelectedMenuItem(navMenuItems);

  /** Handle selecting menu items */
  const handleMenuItemClick = (menuItem: NavMenuItem) => {
    setSelectedMenuItem(menuItem.id);
    if (menuItem.navPath) {
      if (isMobile) {
        closeNav();
        toggleMainNav(false);
      }
      navigate(menuItem.navPath);
    }
    menuItem.onClick?.();
  };

  /** Function to render a NavMenuItemComponent */
  const renderNavMenuItem = (menuItem: NavMenuItem) => {
    const { bold, id, icon, label, showArrow, url } = menuItem;
    return (
      <NavMenuItem
        id={id}
        key={id}
        onClick={() => handleMenuItemClick(menuItem)}
        icon={icon}
        label={label}
        showArrow={showArrow}
        selected={selectedMenuItem === id}
        url={url}
        useTooltip={false}
        bold={bold}
      />
    );
  };

  return (
    <SafSideNav
      id="secondary-side-nav"
      className="olympus-side-nav secondary-side-nav expanded"
      state={'open'}
      aria-label="Secondary navigation"
    >
      <header className="header">
        <SafText appearance="body-strong-md" style={{ paddingLeft: '0.75rem' }}>
          {getPathName(tree, t)}
        </SafText>
        <SafButton iconOnly appearance="tertiary" onClick={closeNav} aria-label="Close secondary navigation">
          <SafIcon icon-name="close" size={16} />
        </SafButton>
      </header>
      <div className="secondary-nav-container">
        {tree === 'support' && (
          <div className="nav-group">
            <div className="support-info">
              <SafText appearance="body-strong-sm">
                <Translate tKey="SUPPORT_HOURS" />
              </SafText>
              <div className="help-menu-item">
                <SafText appearance="body-default-sm">
                  {`Mon-Fri ${formatHour(SupportInfo.SUPPORT_HOURS.weekDays.starting)} - ${formatHour(SupportInfo.SUPPORT_HOURS.weekDays.ending)} ${SupportInfo.SUPPORT_HOURS.weekDays.timezone}`}
                </SafText>
                <br />
                <SafText appearance="body-default-sm">
                  {`Sat-Sun ${formatHour(SupportInfo.SUPPORT_HOURS.weekend.starting)} - ${formatHour(SupportInfo.SUPPORT_HOURS.weekend.ending)} ${SupportInfo.SUPPORT_HOURS.weekend.timezone}`}
                </SafText>
              </div>
            </div>
          </div>
        )}
        <div className="nav-group">{navMenuItems[tree].map(renderNavMenuItem)}</div>
      </div>
    </SafSideNav>
  );
};

export default SecondarySideNav;
