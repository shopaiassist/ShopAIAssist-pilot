interface MyWindow extends Window {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  OptanonActiveGroups?: any;
}
declare let window: MyWindow;

/**
 * Helps work with Cookie Consent Tool (provided by OneTrust)
 * Note: this service doesn't add the consent tool itself but helps with reading data from it.
 * (Copy of Angular service in "src/app/common/service/cookie/cookie-consent.service.ts")
 */
class CookieConsentService {
  protected static _instance: CookieConsentService;

  /** Name of the cookie set by the consent tool */
  public static readonly ONE_TRUST_COOKIE = 'OptanonConsent';

  /** Name of the window prop holding the active groups information */
  public static readonly COOKIE_CONSENT_WINDOW_PROP = 'OptanonActiveGroups';

  /** Cookie property with "active groups" information */
  protected static readonly COOKIE_GROUPS_PROP = 'groups';

  /** Identifiers for cookie groups (needs to match config in 's OneTrust dashboard) */
  protected static readonly TR_COOKIE_CONSENT_GROUPS = {
    essentialCookies: '1',
    performanceCookies: '2',
    functionalCookies: '3',
    targetingCookies: '4',
    socialMediaCookies: '5',
    saleOfPersonalDataCookies: 'BG135', // for California users. Parent category of 4, 5, 2 (if "BG135" is disabled, the child categories are disabled as well)
  };

  /** Values for cookie groups in cookie data (e.g. "C0001:1,C0003:1,SPD_BG:0,C0002:0,C0004:0" or "1:1,3:1,BG135:0,2:0,4:0") */
  protected static readonly COOKIE_GROUP_STATUS = {
    ACTIVE: '1',
    INACTIVE: '0',
  };

  /**
   * Singleton accessor.
   *
   * @constructor
   */
  public static get Instance(): CookieConsentService {
    return this._instance || (this._instance = new CookieConsentService());
  }

  /** Get Consent Group status string (e.g. "C0001:1,C0003:1,SPD_BG:0,C0002:0,C0004:0" or "1:1,3:1,BG135:0,2:0,4:0") */
  public getConsentGroupsStatusString(): string {
    let consentGroups = '';
    try {
      consentGroups = this.getConsentGroupsFromCookie() || this.getConsentGroupsFromWindowData() || '';
    } catch (err) {
      // ignore error
    }
    return consentGroups;
  }

  /** Determine if tracking is allowed based on consent groups status */
  public hasTrackingAllowed(): boolean {
    const consentGroupString = this.getConsentGroupsStatusString();
    return consentGroupString.includes(
      `${CookieConsentService.TR_COOKIE_CONSENT_GROUPS.targetingCookies}:${CookieConsentService.COOKIE_GROUP_STATUS.ACTIVE}`
    );
  }

  /** Get consent groups from cookie data */
  private getConsentGroupsFromCookie(): string | null {
    return this.getConsentCookieContent().get(CookieConsentService.COOKIE_GROUPS_PROP); // e.g. "C0001:1,C0003:0" or "1:1,3:0"
  }

  /** Get content of cookie consent cookie */
  private getConsentCookieContent(): URLSearchParams {
    // Note: The OneTrust cookie has non-standard content. Getting the content via "cookie-storage" package won't work (will cut off content after first property)!
    const cookie = document?.cookie || '';
    const pairs: string[] = cookie.split(/;\s*/);
    const bareCookieData = pairs.find((pair) => pair.indexOf(CookieConsentService.ONE_TRUST_COOKIE) === 0) || '';
    const oneTrustCookieString = decodeURIComponent(bareCookieData.substring(bareCookieData.indexOf('=') + 1));
    return new URLSearchParams(oneTrustCookieString);
  }

  /**
   * Get active consent groups from window object
   * Used as fallback in case the cookie is unavailable.
   */
  private getConsentGroupsFromWindowData(): string {
    const oneTrustActiveGroupsStr: string = window?.[CookieConsentService.COOKIE_CONSENT_WINDOW_PROP] || ''; // e.g. ",C0001,C0003," or ",1,3,"
    const activeGroups = oneTrustActiveGroupsStr.split(',').filter((item) => !!item);
    // add "active" indicator to groups and return as string to match data from cookie
    return activeGroups.map((item) => `${item}:${CookieConsentService.COOKIE_GROUP_STATUS.ACTIVE}`).join(',');
  }
}
export default CookieConsentService;
export const CookieConsentServiceInstance = CookieConsentService.Instance;
