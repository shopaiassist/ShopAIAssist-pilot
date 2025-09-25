/** Utility function to get the name of a navigation path element */
export const getPathName = (path: string, t: (translationKey: string) => string) => {
  switch (path) {
    case 'databases':
      return t('DATABASES');
    case 'manage':
      return t('MANAGE_ShopAIAssist');
    case 'admin':
      return t('ADMIN_SETTINGS');
    case 'support':
      return t('SUPPORT');
    case 'legal':
      return t('LEGAL_INFORMATION');
    case 'favorites':
      return t('FAVORITES');
    case 'permissions':
      return t('USER_PERMISSIONS');
    case 'usage':
      return t('USAGE_ANALYTICS');
    case 'integrations':
      return t('INTEGRATIONS');
    case 'work':
      return t('MY_WORK');
    default:
      return t('UNKNOWN');
  }
};
