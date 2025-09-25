import { UserPermissions } from '@';

import { CariAuthServiceClient } from './feature-access/cari-auth/CariAuthServiceClient';
import { FileManagementFacHandler } from './feature-access/FileManagementFacHandler';
import { GeneralFacHandler } from './feature-access/GeneralFacHandler';
import { SkillFacHandler } from './feature-access/SkillFacHandler';

/**
 * A service for reading and managing entitlements for a user.
 *
 * Given an auth token, this service can determine which permissions the user represented by the token has.
 */
export class EntitlementService {
  protected generalFacHandler: GeneralFacHandler;
  protected fileManagementFacHandler: FileManagementFacHandler;
  protected skillFacHandler: SkillFacHandler;
  protected allFacNames: string[];

  constructor(protected cariAuthService: CariAuthServiceClient) {
    this.generalFacHandler = new GeneralFacHandler();
    this.fileManagementFacHandler = new FileManagementFacHandler();
    this.skillFacHandler = new SkillFacHandler();
    this.allFacNames = [
      ...this.generalFacHandler.getFacNames(),
      ...this.fileManagementFacHandler.getFacNames(),
      ...this.skillFacHandler.getFacNames(),
    ];
  }

  /** Retrieves all ShopAIAssist-related permissions for the user represented by the given token. */
  async fetchEntitlementsForUser(
    authorizationToken: string,
    productId: string
  ): Promise<UserPermissions & { canUseShopAIAssist: boolean }> {
    const facGrants = await this.cariAuthService.fetchFeatureAccessControls(
      authorizationToken,
      productId,
      this.allFacNames
    );
    return {
      ...this.generalFacHandler.processFacs(facGrants),
      fileManagement: this.fileManagementFacHandler.processFacs(facGrants),
      skills: this.skillFacHandler.processFacs(facGrants),
    };
  }

  /** Reformats the permissions for a user into a flat {string:boolean} dictionary. */
  flatFormatEntitlements(entitlements: UserPermissions): { [key: string]: boolean } {
    return {
      ...this.generalFacHandler.flatFormatEntitlements(entitlements),
      ...this.fileManagementFacHandler.flatFormatEntitlements(entitlements.fileManagement),
      ...this.skillFacHandler.flatFormatEntitlements(entitlements.skills),
    };
  }
}
