import { LOG } from 'react';
import axios, { AxiosError, AxiosInstance } from 'axios';
import crypto from 'crypto';

import { defaultUnsetMessage, ensureDefined } from './environment';
import { asError } from './util';

interface Config {
  ONEPASS_API_KEY: string;
  ONEPASS_API_KEY_SECRET: string;
  ONEPASS_API_URL: string;
}

/**
 * Describes the `/onepass/v3/create/orchestrationtoken`
 * response structure.
 */
export interface CreateOrchTokenResponse {
  Header: Header;
  ServiceStatus: ServiceStatus;
  Trace: Trace;
  /**
   * The newly created orchestration token.
   * By default and orchestration token expires after 45 days,
   * but OnePass supports specifying in the request a shorter expiration time.
   */
  Token: string;
}

export interface Header {
  /**
   * The product identifier that was passed in the `Header` property
   * in the request body
   */
  ProductIdentifier: string;
  SlideInformation: string;
  /**
   * The IP address that the request was made from
   */
  UserHostIpAddress: string;
  Version: string;
}

export interface ServiceStatus {
  ElapsedTime: number;
  StartTime: string;
  StatusCode: number;
  StatusDescription: string;
}

export interface Trace {
  ParentGuid: string;
  Product: string;
  RootGuid: string;
  ServerInformation: string;
  SessionGuid: string;
  TransactionGuid: string;
}

/**
 * Describes the `/onepass/v3/authenticate/signontoken`
 * response structure.
 */
export interface AuthenticateSignOnTokenResponse {
  Header: Header;
  ServiceStatus: ServiceStatus;
  Trace: Trace;
  Identifier: string;
  /**
   * The user's profile information (such as first name, email etc...)
   */
  Profile: Profile;
  /**
   * A seamless token can be used to switch the user between  systems without
   * the user having to login to the other system. We use this token to generate
   * an orchestration token.
   */
  SeamlessToken: string;
  BrowserInformation: BrowserInformation;
  IsCDNAvailable: boolean;
  IsMobile: boolean;
  RegistrationKey: string;
  SelectedCulture: string;
  Strength: number;
  TraceId: string;
}

export interface ServiceStatus {
  ElapsedTime: number;
  StartTime: string;
  StatusCode: number;
  StatusDescription: string;
}

/**
 * The user's profile information (such as first name, email etc...)
 */
export interface Profile {
  /**
   * The user's email address
   */
  EmailAddress: string;
  EmailAddressVerified: boolean;
  /**
   * The user's first name
   */
  FirstName: string;
  /**
   * The user's ID in OnePass
   */
  Identifier: string;
  /**
   * The user's last name
   */
  LastName: string;
  PasswordExpirationDate: string;
  PasswordLifetime: number;
  ProfileType: string;
  /**
   * The user's username in OnePass.
   * The user is required to enter this when signing into OnePass.
   */
  Username: string;
}

export interface BrowserInformation {
  AcceptsCompressGZip: boolean;
  AcceptsCookies: boolean;
  AcrobatVersion: string;
  BrowserBuild: string;
  BrowserLanguage: string;
  BrowserName: string;
  ConnectionIsSSL: boolean;
  DeviceName: string;
  DeviceType: string;
  FlashVersion: string;
  FullVersion: string;
  GeckoBuildDate: string;
  IsActiveXEnabled: boolean;
  IsCrawler: boolean;
  IsMobileDevice: boolean;
  IsUsingGeckoEngine: boolean;
  IsUsingWebKitEngine: boolean;
  MajorVersion: number;
  MinorVersion: number;
  MinorVersionLetter: string;
  NETCLRInstalled: boolean;
  NETCLRVersion: string;
  OSDetails: string;
  OSLanguage: string;
  OSName: string;
  OSVersion: string;
  SSLKeySize: number;
  ScreenHeight: number;
  ScreenWidth: number;
  SilverlightVersion: string;
  SupportsActiveXControls: boolean;
  SupportsJavaScript: boolean;
  SupportsSSL: boolean;
  TextSize: number;
  TimeZoneDifference: number;
  UsingProxy: boolean;
  WebKitEngineVersion: string;
  XMLHttpRequest: boolean;
}

interface OnePassError {
  ServiceStatus: {
    StatusDescription: string;
  };
}

/**
 * A  OnePass REST API client
 */
export class OnePass {
  public static readonly ONEPASS_PRODUCT_IDENTIFIER = 'ShopAIAssist';

  public static PATHS = {
    BASE: '/onepass/v3',
    AUTH_SIGNON_TOKEN: '/authenticate/signontoken',
    CREATE_ORCH_TOKEN: '/create/orchestrationtoken',
  };

  private onePassApi: AxiosInstance;
  private config: Config;

  constructor() {
    this.config = OnePass.loadConfigVars();
    this.onePassApi = axios.create({
      baseURL: this.config.ONEPASS_API_URL + OnePass.PATHS.BASE,
    });
  }

  /**
   * Authenticates a `signOnToken` that OnePass sent in query string
   * of the OnePass sign on page callback.
   * Calls the `POST /authenticate/signontoken` endpoint.
   *
   * @param signOnToken The OnePass signon token
   * @returns The user's profile
   */
  public async authenticateSignOnToken(signOnToken: string): Promise<AuthenticateSignOnTokenResponse> {
    const baseReqBodyProps = this.createBaseReqBody();
    try {
      const response = await this.onePassApi.post(OnePass.PATHS.AUTH_SIGNON_TOKEN, {
        ...baseReqBodyProps,
        IncludeProfile: true,
        IncludeRegisteredProducts: true,
        SignonToken: signOnToken,
      });
      return response.data;
    } catch (err) {
      LOG.error(
        `Could not authenticate sign on token ${signOnToken}: ${this.getOnePassErrorMessage(asError(err))}`,
        err
      );
      throw err;
    }
  }

  /**
   * Creates an orchestration token using a `seamlessToken`.
   * A `seamlessToken` is returned in the `authenticateSignOnToken`
   * response.
   *
   * Calls the `POST /create/orchestrationtoken` endpoint.
   *
   * @param userIdentifier the user's (OnePass) ID, used for logging.
   * @param registrationKey the registration key associated with ShopAIAssist (for this user in OnePass).
   * @param seamlessToken The OnePass seamlessToken token.
   * @param lifetime a unix timestamp of how long to token should last
   * @param additionalProperties optional key-value pairs that should be included in the orchestration token's data.
   * @returns The newly created orchestration token.
   */
  public async createOrchestrationToken(
    userIdentifier: string,
    registrationKey: string,
    seamlessToken: string,
    lifetime?: number,
    additionalProperties?: { [key: string]: string }
  ): Promise<CreateOrchTokenResponse> {
    const baseReqBodyProps = this.createBaseReqBody();

    if (!registrationKey) {
      // TODO: Throw some kind of "cannot log in" error that will have the right effect in the UI.
      throw new Error(`A registration key is required for OnePass user ${userIdentifier}.`);
    }

    try {
      const response = await this.onePassApi.post<CreateOrchTokenResponse>(OnePass.PATHS.CREATE_ORCH_TOKEN, {
        ...baseReqBodyProps,
        Properties: [
          {
            Key: 'orig-regkey',
            Value: registrationKey,
          },
          ...(additionalProperties
            ? Object.keys(additionalProperties).map((k) => ({ Key: k, Value: additionalProperties[k] }))
            : []),
        ],
        SeamlessToken: seamlessToken,
        Lifetime: lifetime,
      });
      return response.data;
    } catch (err) {
      LOG.error(
        `Could not create orchestration token for user ${userIdentifier}: ${this.getOnePassErrorMessage(asError(err))}`,
        err
      );
      throw err;
    }
  }

  /**
   * @returns Common properties that are sent in the OnePass API request body.
   */
  private createBaseReqBody() {
    const { ONEPASS_API_KEY } = this.config;

    const nonce = OnePass.generateNonce();
    const apiKeyHash = this.generateApiKeyHash(nonce);

    const baseProps = {
      Header: {
        ProductIdentifier: OnePass.ONEPASS_PRODUCT_IDENTIFIER,
      },
      Trace: {},
      APIKey: ONEPASS_API_KEY,
      APIKeyHash: apiKeyHash,
      Nonce: nonce,
    };
    return baseProps;
  }

  /**
   * @param nonce The nonce generated by `generateNonce()`.
   * @returns A OnePass API key hash
   */
  private generateApiKeyHash(nonce: string): string {
    const { ONEPASS_API_KEY, ONEPASS_API_KEY_SECRET } = this.config;
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const data = ONEPASS_API_KEY + nonce + timestamp;

    const hmac = crypto.createHmac('sha256', ONEPASS_API_KEY_SECRET);
    hmac.update(data);

    return hmac.digest('base64');
  }

  /**
   * @returns Config variables loaded from `process.env`.
   */
  private static loadConfigVars(): Config {
    const { ONEPASS_API_KEY, ONEPASS_API_KEY_SECRET, ONEPASS_API_URL } = process.env;
    return ensureDefined(
      {
        ONEPASS_API_KEY,
        ONEPASS_API_KEY_SECRET,
        ONEPASS_API_URL,
      },
      (unset) => `${defaultUnsetMessage(unset)}. You can get the values from 1Password`
    );
  }

  /**
   * @returns A nonce to use in OnePass API requests.
   */
  private static generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  protected getOnePassErrorMessage(error: Error): string {
    const axiosError = error as AxiosError<OnePassError>;
    return (
      axiosError.response?.data?.ServiceStatus?.StatusDescription ||
      error.message ||
      JSON.stringify(axiosError.response?.data || error)
    );
  }
}
