import { LOG } from 'react';
import { User, UserPermissions } from '@';
import ChainedCustomError from 'typescript-chained-error';

import {
  Auth,
  AUTHORIZATION_SESSION_TIMEOUT_SEC,
  BannerAndGuideMetadata,
  DEFAULT_ABSOLUTE_SESSION_TIMEOUT_SEC,
  LoggedInUser,
} from '../../lib/auth';
import { getRequiredEnvironmentVariable } from '../../lib/environment';
import { OnePass, Profile } from '../../lib/onepass';
import { EntitlementService } from './entitlement/EntitlementService';
import { CariAuthServiceClient, UserAndOrgDetail } from './entitlement/feature-access/cari-auth/CariAuthServiceClient';

/**
 * Service for authenticating and logging in users.
 */
export class AuthService {
  /** OnePass API client. */
  protected onePass: OnePass;

  /** Auth library. */
  protected auth: Auth;

  protected cariAuthService: CariAuthServiceClient;
  protected entitlementService: EntitlementService;

  constructor() {
    this.onePass = new OnePass();
    this.auth = new Auth();
    this.cariAuthService = new CariAuthServiceClient(getRequiredEnvironmentVariable('CARI_AUTH_SERVICE_URL'));
    this.entitlementService = new EntitlementService(this.cariAuthService);
  }

  /**
   * Authenticates a `signOnToken`, creates an orchestration token
   * and wraps the token in a JWT.
   *
   * @param signOnToken The OnePass signon token (valid for 30 seconds) that was received in the callback query string.
   * @returns a `LoggedInUser`'s details. This can be used to set the auth cookie.
   */
  public async loginUser(signOnToken: string): Promise<LoggedInUser> {
    // 1. the SignOn Token is validated and a Seamless Token is generated.
    LOG.debug(`AuthService.loginUser() authenticating sign-on token ${signOnToken}.`);
    const { SeamlessToken, Profile, RegistrationKey } = await this.onePass.authenticateSignOnToken(signOnToken);
    // 2. the Seamless Token is used to generate a preliminary Orchestration Token.
    LOG.debug(
      `AuthService.loginUser() creating orchestration token for OnePass user ${Profile?.Identifier} using registration key ${RegistrationKey}.`
    );
    const preliminaryToken = (
      await this.onePass.createOrchestrationToken(
        Profile.Identifier,
        RegistrationKey,
        SeamlessToken,
        AUTHORIZATION_SESSION_TIMEOUT_SEC
      )
    ).Token;
    // 3. the preliminary Orchestration Token is used to check user permissions, get additional user detail (UserGuid),
    //    and get details about the user's org. Then the Seamless Token is used to create the final Orchestration Token,
    //    the userToken, which has all of the details associated with it (permissions, UserGuid, and org details).
    LOG.debug(`AuthService.loginUser() checking entitlements for user ${Profile?.Identifier}.`);
    const { userToken, entitlements, userAndOrgDetails } = await this.createUserTokenWithEntitlements(
      preliminaryToken,
      Profile,
      RegistrationKey,
      SeamlessToken
    );

    // 4. Then a JWT is created for session tracking with Olympus (only), and returned with the auth data.
    LOG.debug(`AuthService.loginUser() generating session token for user ${Profile?.Identifier}.`);
    const jwt = await this.auth.generateUserJwt(userToken);
    const { userProfile, bannerAndGuideMetadata } = this.formatUserProfile(Profile, RegistrationKey, userAndOrgDetails);
    // Remove the canUseShopAIAssist flag because we won't need it beyond this service.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { canUseShopAIAssist, ...permissions } = entitlements;

    LOG.info(
      `AuthService.loginUser() login complete for user ${Profile?.Identifier} with userGuid ${userProfile.userGuid}.`
    );
    return {
      orchestrationToken: userToken,
      user: userProfile,
      permissions,
      bannerAndGuideMetadata,
      jwt,
    };
  }

  /** Fetches entitlements (features the user is allowed) and user and org details. */
  protected async createUserTokenWithEntitlements(
    authorizationToken: string,
    profile: Profile,
    registrationKey: string,
    seamlessToken: string
  ) {
    const entitlements = await this.entitlementService.fetchEntitlementsForUser(
      authorizationToken,
      OnePass.ONEPASS_PRODUCT_IDENTIFIER
    );
    if (!entitlements.canUseShopAIAssist) {
      throw new NotAuthorizedLoginError(`User ${profile.Identifier} is not entitled to use ShopAIAssist.`);
    }
    const { userToken, userAndOrgDetails } = await this.createUserToken(
      authorizationToken,
      profile,
      registrationKey,
      seamlessToken,
      entitlements
    );
    return { userToken, entitlements, userAndOrgDetails };
  }

  protected async createUserToken(
    authorizationToken: string,
    profile: Profile,
    registrationKey: string,
    seamlessToken: string,
    entitlements: UserPermissions
  ) {
    const userAndOrgDetails = await this.cariAuthService.fetchUserAndOrgDetails(
      authorizationToken,
      OnePass.ONEPASS_PRODUCT_IDENTIFIER,
      registrationKey
    );
    const userToken = (
      await this.onePass.createOrchestrationToken(
        profile.Identifier,
        registrationKey,
        seamlessToken,
        DEFAULT_ABSOLUTE_SESSION_TIMEOUT_SEC,
        await this.formatTokenData(userAndOrgDetails, entitlements)
      )
    ).Token;
    return { userToken, userAndOrgDetails };
  }

  protected formatBannerAndGuideMetadata(onePassProfile: Profile, userAndOrgDetails: UserAndOrgDetail) {
    return {
      visitor: {
        id: onePassProfile.Identifier,
        prismid: userAndOrgDetails.userGuid,
      },
      account: {
        id: userAndOrgDetails.orgHeadquartersZWNbr,
        paymentGroupNumber: userAndOrgDetails.orgPaymentGroupZPNbr,
      },
    };
  }

  protected formatEntitlements(entitlements: UserPermissions): { [key: string]: string } {
    // Format our flat {string:boolean} entitlement values as string:'True'|'False'.
    return Object.fromEntries(
      Object.entries(this.entitlementService.flatFormatEntitlements(entitlements)).map(([key, value]) => [
        `ShopAIAssist.${key}`,
        value ? 'True' : 'False',
      ])
    );
  }

  protected async formatTokenData(
    userAndOrgDetails: UserAndOrgDetail,
    entitlements: UserPermissions
  ): Promise<{ [key: string]: string }> {
    return { ...this.formatUserAndOrgDetails(userAndOrgDetails), ...this.formatEntitlements(entitlements) };
  }

  protected formatUserAndOrgDetails(detail: UserAndOrgDetail): { [key: string]: string } {
    return {
      UserGuid: detail.userGuid,
      OrgId: detail.orgHeadquartersZWNbr,
      Country: detail.orgLocationCountryCode,
    };
  }

  /**
   * Extracts the properties we want in the OnePass `Profile` and wraps them into a `User` object.
   */
  protected formatUserProfile(
    onePassProfile: Profile,
    registrationKey: string,
    userAndOrgDetails: UserAndOrgDetail
  ): { userProfile: User; bannerAndGuideMetadata: BannerAndGuideMetadata } {
    const { EmailAddress, FirstName, LastName } = onePassProfile;
    return {
      userProfile: {
        email: EmailAddress,
        firstName: FirstName,
        lastName: LastName,
        userGuid: userAndOrgDetails.userGuid,
        registrationKey,
        organization: {
          id: userAndOrgDetails.orgHeadquartersZWNbr,
          locationCountryCode: userAndOrgDetails.orgLocationCountryCode,
        },
      },
      bannerAndGuideMetadata: this.formatBannerAndGuideMetadata(onePassProfile, userAndOrgDetails),
    };
  }
}

export class NotAuthorizedLoginError extends ChainedCustomError {}
