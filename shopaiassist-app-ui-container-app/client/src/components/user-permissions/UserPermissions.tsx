import { i18n } from '@/';
import { SafText } from '@/core-components/react';

import UserPermissionsGrid from './UserPermissionsGrid';

const UserPermissions = () => {
  const { t } = i18n.useTranslation();
  return (
    <div>
      <div>
        <SafText appearance="display-sm">{t('USER_PERMISSIONS_TITLE')}</SafText>
      </div>
      <div>
        <SafText appearance="body-default-md">{t('USER_PERMISSIONS_SUBTITLE')}</SafText>
      </div>
      <UserPermissionsGrid />
    </div>
  );
};

export default UserPermissions;
