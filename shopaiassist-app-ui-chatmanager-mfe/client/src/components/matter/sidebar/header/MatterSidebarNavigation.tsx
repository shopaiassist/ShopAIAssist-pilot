import { Button, Icon, Text } from '@on/core-components/react';
import { useTranslation } from 'react-i18next';
import useMatterSidebarNav from '../../../../hooks/useMatterSidebarNav';

interface MatterSidebarNavigationProps {
  closeSidebar: () => void;
  className?: string;
  isSubsectionView: boolean;
}

/**
 * A component for navigating within the Matter Sidebar.
 * This component provides navigation controls, including a back button when in folder view and a home label otherwise.
 *
 * @param {MatterSidebarNavigationProps} props - The properties for the MatterSidebarNavigation component.
 * @param {string} [props.className] - Additional class name(s) for custom styling.
 * @param {boolean} props.isSubsectionView - A flag indicating whether the current view is a folder view.
 * @returns {JSX.Element} The rendered navigation component for the Matter Sidebar.
 *
 * @example
 * <MatterSidebarNavigation className="custom-class" isSubsectionView={true} />
 */

const MatterSidebarNavigation = ({ className, isSubsectionView, closeSidebar }: MatterSidebarNavigationProps) => {
  const [navigateBack] = useMatterSidebarNav();
  const { t } = useTranslation();
  const chatHistoryStyle = {
    marginTop: '0',
    marginBottom: '0'
  };
  return (
    <div className={className}>
      {/* {isSubsectionView ? (
        <Button onClick={navigateBack} appearance="tertiary" density="compact" data-testid="matter-sidebar-nav-back">
          <div className="matter-sidebar-nav-back">
            <Icon size={24} iconName="angle-left" />
            <Text appearance="body-strong-md">{t('BACK')}</Text>
          </div>
        </Button>
      ) : (
        <Text appearance="body-strong-md">{t('HOME')}</Text>
      )} */}

      <h3 style={chatHistoryStyle}>{t('CHAT_HISTORY')}</h3>
      <Button onClick={closeSidebar} appearance="tertiary" data-testid="matter-sidebar-nav-close" a11y-aria-label="Close submenu">
        <Icon size={16} iconName="close" />
      </Button>
    </div>
  );
};
export default MatterSidebarNavigation;
