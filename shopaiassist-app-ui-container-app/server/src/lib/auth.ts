import { User, UserPermissions } from '@';
import { sign as jsonwebtokenSign } from 'jsonwebtoken';

import { defaultUnsetMessage, ensureDefined } from './environment';

const ONE_HOUR_SEC = 60 * 60;
const TWENTY_FOUR_HOURS_SEC = ONE_HOUR_SEC * 24;
const TWO_WEEKS_SEC = TWENTY_FOUR_HOURS_SEC * 14;
export const AUTHORIZATION_SESSION_TIMEOUT_SEC = ONE_HOUR_SEC;
export const DEFAULT_ABSOLUTE_SESSION_TIMEOUT_SEC = TWO_WEEKS_SEC;

/** The structure returned by `/api/user/me` describing the logged in user. */
export interface LoggedInUser {
  /** The OnePass orchestration token */
  orchestrationToken: string;
  /** The user and org details */
  user: User;
  /** The ShopAIAssist specific permissions for the user */
  permissions: UserPermissions;
  /** Identifying information for the banner and guide system. */
  bannerAndGuideMetadata: BannerAndGuideMetadata;
  /** The JWT session token used by Olympus. */
  jwt: string;
}

/**
 * The structure of data needed by our Banner and Guide system to identify the logged in user, for use in displaying
 * trial banners and product guides.
 */
export interface BannerAndGuideMetadata {
  visitor: {
    /**
     * The identifier in Pendo for the user, currently the OnePass ID so that they'll inherit metadata from other legal
     * projects.
     */
    id: string;
  };
  account: {
    /** The identifier in Pendo for the customer organization. */
    id: string;
  };
}

interface Config {
  JWT_PRIVATE_KEY: string;
}

/**
 * Library class for user authentication
 */
export class Auth {
  private config: Config;

  constructor() {
    this.config = Auth.loadConfigVars();
  }

  /**
   * @param orchestrationToken The `orchestrationToken` from OnePass to store in the JWT
   * @returns a JWT for storing in the auth cookie.
   */
  public async generateUserJwt(orchestrationToken: string) {
    return await new Promise<string>((resolve, reject) => {
      jsonwebtokenSign(
        { ot: orchestrationToken },
        this.config.JWT_PRIVATE_KEY,
        {
          expiresIn: DEFAULT_ABSOLUTE_SESSION_TIMEOUT_SEC,
        },
        (err, encoded) => {
          if (err || !encoded) {
            reject(err);
            return;
          }
          resolve(encoded);
        }
      );
    });
  }

  /**
   * @returns Config variables loaded from `process.env`.
   */
  private static loadConfigVars(): Config {
    const { JWT_PRIVATE_KEY } = process.env;
    return ensureDefined(
      {
        JWT_PRIVATE_KEY,
      },
      (unset) => `${defaultUnsetMessage(unset)}. You can generate your own key`
    );
  }
}
