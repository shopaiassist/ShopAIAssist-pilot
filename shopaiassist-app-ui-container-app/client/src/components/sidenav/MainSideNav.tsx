import React from 'react';
import { i18n } from '@/';
import { SafSideNav } from '@/core-components/react';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';

import { OLYMPUS_ROUTES } from '../../App';
import useMattersSideNav from '../../hooks/useMattersSideNav';
import useMFECommunication from '../../hooks/useMFECommunication';
import useSelectedMenuItem from '../../hooks/useSelectedMenuItem';
import MainFooter from '../footer/MainFooter';
import NavMenuItemComponent from './NavMenuItem';

import './SideNav.scss';

interface MainSideNavProps {
  expanded: boolean;
  isMobile: boolean;
  toggleExpanded: (expanded?: boolean) => void;
  setSecondaryNavState: (state: SecondaryNavState) => void;
}

const MainSideNav = ({ expanded, isMobile, toggleExpanded, setSecondaryNavState }: MainSideNavProps) => {
  const [sendEvent] = useMFECommunication('isSortingMenu');
  const navigate = useNavigate();
  const { t } = i18n.useTranslation();

  const [, , handleMyWorkClick] = useMattersSideNav();

  /** List of nav menu items to render */
  const navMenuItems: NavMenuTree = {
    topGroup: [
      {
        id: 'my-work-nav-item',
        icon: 'sparkles',
        bold: true,
        label: t('CHAT_HISTORY'),
        showArrow: true,
        navPath: OLYMPUS_ROUTES.WORK,
        onClick: handleMyWorkClick,
        pendoId: 'chat-history-button',
      },
      // {
      //   id: 'matters-nav-item',
      //   icon: 'database',
      //   bold: true,
      //   label: t('DATABASES'),
      //   navPath: OLYMPUS_ROUTES.DATABASES,
      // },
      // {
      //   id: 'manage-nav-item',
      //   icon: 'gear',
      //   bold: true,
      //   label: t('MANAGE_ShopAIAssist'),
      //   showArrow: true,
      //   secondaryNavTree: 'manage',
      // },
      // TODO: Admin settings got pushed to post-release. Re-enable when ready.
      // {
      //   id: 'admin-settings-nav-item',
      //   icon: 'sitemap',
      //   bold: true,
      //   label: t('ADMIN_SETTINGS'),
      //   showArrow: true,
      //   secondaryNavTree: 'admin',
      // },
    ],
    bottomGroup: [
      // {
      //   id: 'whats-new-nav-item',
      //   icon: 'bell',
      //   bold: true,
      //   label: t('WHATS_NEW'),
      //   url: 'https://www.example.com/en/release-notes.html', // TODO: Need final URL for this
      // },
      // {
      //   id: 'support-nav-item',
      //   icon: 'circle-question',
      //   bold: true,
      //   label: t('SUPPORT'),
      //   showArrow: true,
      //   secondaryNavTree: 'support',
      // },
      // {
      //   id: 'legal-nav-item',
      //   icon: 'shield',
      //   bold: true,
      //   label: t('LEGAL_INFORMATION'),
      //   showArrow: true,
      //   secondaryNavTree: 'legal',
      // },
    ],
  };

  const [selectedMenuItem, setSelectedMenuItem] = useSelectedMenuItem(navMenuItems);

  /** Handle selecting menu items */
  const handleMenuItemClick = (menuItem: NavMenuItem) => {
    setSelectedMenuItem(menuItem.id);
    if (menuItem.secondaryNavTree) {
      setSecondaryNavState({ show: true, tree: menuItem.secondaryNavTree });
    } else {
      setSecondaryNavState({ show: false, tree: 'manage' });
      sendEvent({ message: 'isSortingMenu', body: { isSortingMenu: true } });
    }
    if (menuItem.navPath) {
      if (isMobile) toggleExpanded(false);
      navigate(menuItem.navPath);
    }
    menuItem.onClick?.();
  };

  /** Function to render a NavMenuItemComponent */
  const renderNavMenuItem = (menuItem: NavMenuItem) => {
    const { bold, id, icon, label, showArrow, url, pendoId } = menuItem;
    return (
      <NavMenuItemComponent
        id={id}
        key={id}
        onClick={() => handleMenuItemClick(menuItem)}
        icon={icon}
        label={label}
        showArrow={showArrow}
        bold={bold}
        selected={selectedMenuItem === id}
        url={url}
        hasLink={!!url}
        pendoId={pendoId}
      />
    );
  };

  return (
    <SafSideNav
      id="main-side-nav"
      className={classNames('olympus-side-nav main-side-nav', { expanded: expanded })}
      state={expanded ? 'open' : 'closed'}
      openAriaLabel="Expand main navigation"
      closeAriaLabel="Collapse main navigation"
      aria-label="Main navigation"
      openSvgName="arrow-right-from-line"
      closeSvgName="arrow-left-from-line"
      onClose={() => {
        toggleExpanded(false);
      }}
      onOpen={() => {
        toggleExpanded(true);
      }}
    >
      <div className="main-nav-container">
        <div className="nav-group">{navMenuItems.topGroup.map(renderNavMenuItem)}</div>
        <div className="nav-group">
          {navMenuItems.bottomGroup.map(renderNavMenuItem)}
          {expanded && <MainFooter isMobile={isMobile} />}
        </div>
      </div>
    </SafSideNav>
  );
};

export default MainSideNav;
