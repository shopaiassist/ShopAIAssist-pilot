import { FileManagementPermissions } from '@';

import { FacGrants } from './cari-auth/FacGrants';
import { FacHandler } from './FacHandler';

/**
 * A handler for _file management_ FACs, like whether the user can view, create, and/or share document databases.
 */
export class FileManagementFacHandler implements FacHandler<FileManagementPermissions> {
  protected static readonly VIEW_DATABASES_FAC_NAME = 'ShopAIAssist VIEW DATABASE ACCESS';

  protected static readonly CREATE_DATABASES_FAC_NAME = 'ShopAIAssist CREATE DATABASE ACCESS';

  protected static readonly SHARE_DATABASES_FAC_NAME = 'ShopAIAssist SHARE DATABASE ACCESS';

  flatFormatEntitlements(entitlements: FileManagementPermissions): { [key: string]: boolean } {
    const { canViewDatabases, canCreateDatabases, canShareDatabases } = entitlements;
    return { canViewDatabases, canCreateDatabases, canShareDatabases };
  }

  getFacNames(): string[] {
    return [
      FileManagementFacHandler.VIEW_DATABASES_FAC_NAME,
      FileManagementFacHandler.CREATE_DATABASES_FAC_NAME,
      FileManagementFacHandler.SHARE_DATABASES_FAC_NAME,
    ];
  }

  processFacs(facGrants: FacGrants): FileManagementPermissions {
    return {
      canViewDatabases: facGrants.isGranted(FileManagementFacHandler.VIEW_DATABASES_FAC_NAME),
      canCreateDatabases: facGrants.isGranted(FileManagementFacHandler.CREATE_DATABASES_FAC_NAME),
      canShareDatabases: facGrants.isGranted(FileManagementFacHandler.SHARE_DATABASES_FAC_NAME),
    };
  }
}
