import React from 'react';
import { i18n } from '@/';
import { SafText } from '@/core-components/react';

import './MainFooter.scss';

interface MainFooterProps {
  isMobile: boolean;
}

/** Main footer component.
 * Displays the footer of the application. Meant to be used at the bottom of the main sidebar in the Matters MFE.
 */
const MainFooter = ({ isMobile }: MainFooterProps) => {
  const { t } = i18n.useTranslation();
  return (
    <footer className="main-footer">
      <SafText appearance="body-default-xs" className="copyright">
        {t('COPYRIGHT')}
        {!isMobile && <br />} {t('ALL_RIGHTS_RESERVED')}
      </SafText>
    </footer>
  );
};

export default MainFooter;
