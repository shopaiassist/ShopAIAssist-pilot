import axios, { AxiosError, AxiosInstance } from 'axios';
import ChainedCustomError from 'typescript-chained-error';

import { asError } from '../../../../../lib/util';
import { FacGrants } from './FacGrants';


export class CariAuthServiceClient {
  protected static readonly PATHS = {
    CHECK_PERMISSION: '/api/v1/check-permission',
    USER_GUID: '/api/v1/user-guid',
    ORG_DETAILS: '/api/v1/org-details',
  };
  protected static readonly APPLICATION_FEATURE_NAME = 'APPLICATION';

  protected client: AxiosInstance;

  constructor(cariAuthUrl: string) {
    this.client = axios.create({
      baseURL: cariAuthUrl,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  }

  /**
   * Returns a 'Grant' or 'Deny' value for each of the FAC names given for the user represented by the given token.
   * @param authorizationToken the OnePass orchestration token.
   * @param productId the product ID the orchestration token was created with.
   * @param featureAccessControlNames the names of each FAC to check for.
   */
  async fetchFeatureAccessControls(
    authorizationToken: string,
    productId: string,
    featureAccessControlNames: string[]
  ): Promise<FacGrants> {
    try {
      const checkPermissionResponse = await this.queryFeatureAccessControls(
        authorizationToken,
        productId,
        featureAccessControlNames
      );
      const featurePermissions = checkPermissionResponse.data.featurePermissions;
      const applicationResourcePermissions = featurePermissions?.find(
        (fp) => fp.feature === CariAuthServiceClient.APPLICATION_FEATURE_NAME
      )?.resourcePermissions;
      if (applicationResourcePermissions) {
        const facMap: { [facName: string]: 'Grant' | 'Deny' } = {};
        applicationResourcePermissions.forEach((perm) => (facMap[perm.resource] = perm.permission));
        return new FacGrants(facMap);
      } else {
        throw new CariAuthError(`Invalid server response: ${JSON.stringify(checkPermissionResponse.data)}`);
      }
    } catch (err) {
      const axiosErr = asError<AxiosError>(err, AxiosError);
      if (axiosErr) {
        throw new CariAuthError(
          `Error ${axiosErr.response?.status || axiosErr.status} connecting to CARI Auth service: ${axiosErr.response?.data ? JSON.stringify(axiosErr.response.data) : axiosErr.message}`,
          axiosErr
        );
      }
      const error = asError(err);
      throw new CariAuthError(`Unknown error: ${error.message}`, error);
    }
  }

  /**
   * Requests the user GUID and the organization details for the user represented by the given token.
   * @param authorizationToken the OnePass orchestration token.
   * @param productId the product ID the orchestration token was created with.
   * @param registrationKey the reg key for the user.
   */
  async fetchUserAndOrgDetails(
    authorizationToken: string,
    productId: string,
    registrationKey: string
  ): Promise<UserAndOrgDetail> {
    const userGuidResponse = await this.queryUserGuid(authorizationToken, productId, registrationKey);
    const userGuid = userGuidResponse.data.UserGuid;

    const orgDetailsResponse = await this.queryOrgDetails(authorizationToken, productId, registrationKey);
    const orgDetails = orgDetailsResponse.data;
    return {
      userGuid,
      ...orgDetails,
    };
  }

  /** Returns the headers expected by the CARI Auth service for authenticating the user. */
  protected getAuthHeaders(
    authorizationToken: string,
    productId: string,
    registrationKey?: string
  ): { [header: string]: string } {
    const headers: { [header: string]: string } = {
      Authorization: `Bearer ${authorizationToken}`,
      'product-Id': productId,
    };
    if (registrationKey) {
      headers['reg-key'] = registrationKey;
    }
    return headers;
  }

  protected async queryFeatureAccessControls(
    authorizationToken: string,
    productId: string,
    featureAccessControlNames: string[]
  ) {
    return await this.client.post<CheckPermissionResponse>(
      CariAuthServiceClient.PATHS.CHECK_PERMISSION,
      {
        [CariAuthServiceClient.APPLICATION_FEATURE_NAME]: featureAccessControlNames,
      },
      { headers: this.getAuthHeaders(authorizationToken, productId) }
    );
  }

  protected async queryOrgDetails(authorizationToken: string, productId: string, registrationKey: string) {
    return await this.client.get<OrgDetailsResponse>(CariAuthServiceClient.PATHS.ORG_DETAILS, {
      headers: this.getAuthHeaders(authorizationToken, productId, registrationKey),
    });
  }

  protected async queryUserGuid(authorizationToken: string, productId: string, registrationKey: string) {
    return await this.client.get<UserGuidResponse>(CariAuthServiceClient.PATHS.USER_GUID, {
      headers: this.getAuthHeaders(authorizationToken, productId, registrationKey),
    });
  }
}

type FacName = string;

interface CheckPermissionResponse {
  featurePermissions: {
    feature: 'APPLICATION';
    resourcePermissions: { resource: FacName; permission: 'Deny' | 'Grant' }[];
  }[];
}

/** The response to a user-guid request to the CARI Auth service. */
interface UserGuidResponse {
  UserGuid: string;
}

/** The response to an org-details request to the CARI Auth service. */
export interface OrgDetail {
  /** The sales org for this customer, e.g. `'WEST'`. */
  salesOrg: string;
  /** Sometimes the same value as `orgHeadquartersZWNbr` */
  orgLocationZBNbr: string;
  /** The org ID, in the format `'1004637433'`. */
  orgHeadquartersZWNbr: string;
  /** Sometimes the same value as `orgHeadquartersZWNbr` */
  orgPaymentGroupZPNbr: string;
  /** A country code, e.g. `'US'`. */
  orgLocationCountryCode: string;
  /** A system identifier, e.g. `'SAP'`. */
  busSystemDataOwner: string;
}

export interface UserDetail {
  userGuid: string;
}

export type UserAndOrgDetail = UserDetail & OrgDetail;

type OrgDetailsResponse = OrgDetail;

/** Thrown when an error occurs communicating with the CARI Auth service. */
export class CariAuthError extends ChainedCustomError {}
