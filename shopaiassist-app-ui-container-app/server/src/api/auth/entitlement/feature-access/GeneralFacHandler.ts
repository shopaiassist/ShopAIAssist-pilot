import { GeneralPermissions } from '@';

import { FacGrants } from './cari-auth/FacGrants';
import { FacHandler } from './FacHandler';

type InfrastructureRegion = 'US' | 'UK' | 'CA' | 'AU';

/**
 * A handler for general ShopAIAssist FACs, like whether the user has product access to ShopAIAssist at all, and whether they
 * are an admin user.
 */
export class GeneralFacHandler implements FacHandler<GeneralPermissions> {
  protected static readonly ADMIN_FAC_NAMES: string[] = ['ShopAIAssist APPLICATION ADMIN'];

  protected static readonly PRODUCT_FAC_NAMES_BY_INFRASTRUCTURE_REGION: { [region in InfrastructureRegion]: string } = {
    US: 'PRDCT ShopAIAssistCORE US',
    UK: 'PRDCT ShopAIAssistCORE UK',
    CA: 'PRDCT ShopAIAssistCORE CA',
    AU: 'PRDCT ShopAIAssistCORE AU',
  };

  flatFormatEntitlements(entitlements: GeneralPermissions): { [key: string]: boolean } {
    const { isAdmin } = entitlements;
    return { isAdmin };
  }

  getFacNames(): string[] {
    return [
      ...GeneralFacHandler.ADMIN_FAC_NAMES,
      ...Object.values(GeneralFacHandler.PRODUCT_FAC_NAMES_BY_INFRASTRUCTURE_REGION),
    ];
  }

  processFacs(
    facGrants: FacGrants
  ): GeneralPermissions & { canUseShopAIAssist: boolean; infrastructureRegion?: InfrastructureRegion } {
    // While we're rolling out this feature and FACs haven't been set up for dev an QA users, allow them to access
    // ShopAIAssist regardless of their FACs.
    const authBypassed = process.env.TEMP_ENABLE_AUTHORIZATION !== 'true';
    const facs: GeneralPermissions & { canUseShopAIAssist: boolean; infrastructureRegion?: InfrastructureRegion } = {
      isAdmin: facGrants.areAllGranted(GeneralFacHandler.ADMIN_FAC_NAMES),
      canUseShopAIAssist:
        facGrants.isOneGranted(Object.values(GeneralFacHandler.PRODUCT_FAC_NAMES_BY_INFRASTRUCTURE_REGION)) ||
        authBypassed,
    };
    const infrastructureRegion = this.getInfrastructureRegion(facGrants);
    if (infrastructureRegion) {
      facs.infrastructureRegion = infrastructureRegion;
    }
    return facs;
  }

  protected getInfrastructureRegion(facGrants: FacGrants): InfrastructureRegion | undefined {
    for (const [region, facName] of Object.entries(GeneralFacHandler.PRODUCT_FAC_NAMES_BY_INFRASTRUCTURE_REGION) as [
      InfrastructureRegion,
      string,
    ][]) {
      if (facGrants.isGranted(facName)) {
        return region;
      }
    }
    return undefined;
  }
}
