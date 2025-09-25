import { CookieStorage } from 'cookie-storage';

import CookieConsentService from './CookieConsent';

describe('CookieConsent Service', () => {
  let service: CookieConsentService;
  let cookieService: CookieStorage;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const myWindow = window as any;

  // Mocks using  OneTrust group ids
  const mockWindowActiveGroups_tr_disallowTracking = ',1,3,';
  const mockWindowActiveGroups_tr_allowTracking = ',1,2,3,4,5,BG135,';
  const mockCookieActiveGroups_tr_disallowTracking = '1:1,3:1,BG135:0,2:0,4:0';
  const mockCookieActiveGroups_tr_allowTracking = '1:1,3:1,BG135:1,2:1,4:1';

  const getMockCookieData = (activeGroupsData: string) => {
    // actual string of a consent cookie but with dynamic "groups" value
    return `isGpcEnabled=0&datestamp=Tue+May+30+2023+16%3A57%3A55+GMT-0700+(Pacific+Daylight+Time)&version=202303.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=b7745d37-9b1e-4013-8dc9-49cf069703a3&interactionCount=2&landingPath=NotLandingPage&groups=${encodeURIComponent(
      activeGroupsData
    )}&AwaitingReconsent=false&geolocation=US%3BCA`;
  };

  beforeAll(() => {
    cookieService = new CookieStorage();
  });

  beforeEach(() => {
    service = new CookieConsentService();
  });

  afterEach(() => {
    delete myWindow[CookieConsentService.COOKIE_CONSENT_WINDOW_PROP];
    cookieService.removeItem(CookieConsentService.ONE_TRUST_COOKIE);
    jest.restoreAllMocks();
  });

  describe('getConsentGroupsStatusString', () => {
    describe('for  categories', () => {
      it('should return data from cookie', () => {
        cookieService.setItem(
          CookieConsentService.ONE_TRUST_COOKIE,
          getMockCookieData(mockCookieActiveGroups_tr_disallowTracking)
        );
        myWindow[CookieConsentService.COOKIE_CONSENT_WINDOW_PROP] = mockWindowActiveGroups_tr_allowTracking;
        expect(service.getConsentGroupsStatusString()).toEqual(mockCookieActiveGroups_tr_disallowTracking);
      });

      it('should return data from window object if cookie data is missing', () => {
        myWindow[CookieConsentService.COOKIE_CONSENT_WINDOW_PROP] = mockWindowActiveGroups_tr_allowTracking;
        expect(service.getConsentGroupsStatusString()).toEqual('1:1,2:1,3:1,4:1,5:1,BG135:1');
      });

      it('should return empty string if neither cookie nor window object have data', () => {
        expect(service.getConsentGroupsStatusString()).toEqual('');
      });
    });
  });

  describe('hasTrackingAllowed', () => {
    describe('for  categories', () => {
      it('should return true if tracking is allowed via cookie data', () => {
        cookieService.setItem(
          CookieConsentService.ONE_TRUST_COOKIE,
          getMockCookieData(mockCookieActiveGroups_tr_allowTracking)
        );
        myWindow[CookieConsentService.COOKIE_CONSENT_WINDOW_PROP] = mockWindowActiveGroups_tr_disallowTracking;
        expect(service.hasTrackingAllowed()).toBe(true);
      });

      it('should return false if tracking is disallowed via cookie data', () => {
        cookieService.setItem(
          CookieConsentService.ONE_TRUST_COOKIE,
          getMockCookieData(mockCookieActiveGroups_tr_disallowTracking)
        );
        myWindow[CookieConsentService.COOKIE_CONSENT_WINDOW_PROP] = mockWindowActiveGroups_tr_allowTracking;
        expect(service.hasTrackingAllowed()).toBe(false);
      });

      it('should return true if cookie is missing and tracking is allowed via window object', () => {
        myWindow[CookieConsentService.COOKIE_CONSENT_WINDOW_PROP] = mockWindowActiveGroups_tr_allowTracking;
        expect(service.hasTrackingAllowed()).toBe(true);
      });

      it('should return true if cookie is missing and tracking is disallowed via window object', () => {
        myWindow[CookieConsentService.COOKIE_CONSENT_WINDOW_PROP] = mockWindowActiveGroups_tr_disallowTracking;
        expect(service.hasTrackingAllowed()).toBe(false);
      });

      it('should return false if neither cookie nor window object have data', () => {
        expect(service.hasTrackingAllowed()).toBe(false);
      });
    });
  });
});
