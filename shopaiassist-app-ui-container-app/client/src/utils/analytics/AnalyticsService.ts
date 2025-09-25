import { EventProperties, UserTraits } from 'a/analytics-core';
import { AliasParams, IdentifyParams, PageParams, TrackParams } from '@segment/analytics-node';

import LOG from '../../services/LoggingService';
import { AnalyticsApi } from '../api/analytics';
import { CookieConsentServiceInstance } from '../cookie/CookieConsent';
import { ClientAnalyticsEvent } from './analytics-events';

/** The structure for the `page` object within the `context` of an event. */
export interface PageContext {
  path?: string;
  referrer?: string;
  search?: string;
  title?: string;
  url?: string;
}

/** Defines the base requirements for an event sent to the Maat server to be tunneled (forwarded) to the analytics server. */
export interface EventDefaults {
  anonymousId: string;
  context?: {
    page: PageContext;
    userAgent: string;
  };
  consent?: string;
}

export interface AnalyticsClient {
  identify(uid: string, traits?: UserTraits): Promise<void>;
  track(event: ClientAnalyticsEvent, properties?: EventProperties): Promise<void>;
  page(name: string, properties?: EventProperties): Promise<void>;
  alias(userId: string, previousId: string): Promise<void>;
}

export const LOCAL_STORAGE_KEY_ANONYMOUS_ID = 'ajs_anonymous_id';

/**
 * A service for sending Segment analytics events to the analytics server.
 */
class AnalyticsService implements AnalyticsClient {
  protected static _instance: AnalyticsService;
  protected analyticsApi: AnalyticsApi;

  /**
   * Singleton accessor.
   *
   * @constructor
   */
  public static get Instance(): AnalyticsService {
    return this._instance || (this._instance = new AnalyticsService());
  }

  protected constructor() {
    this.analyticsApi = new AnalyticsApi();
  }

  /**
   * Identify Event
   * @param uid - User ID
   * @param traits - Optional user traits
   */
  public async identify(uid: string, traits?: UserTraits): Promise<void> {
    const message: IdentifyParams = {
      userId: uid,
      traits,
      ...this.getDefaults(),
    };
    try {
      await this.analyticsApi.identify(message);
    } catch (err) {
      // TODO: Switch to use LOG from 
      LOG.error(`Error identifying user '${uid}': `, err);
    }
  }

  /**
   * Track Event
   * @param event - Event name
   * @param properties - Optional event properties
   */
  public async track(event: ClientAnalyticsEvent, properties: EventProperties = {}): Promise<void> {
    properties.consent = CookieConsentServiceInstance.getConsentGroupsStatusString();
    const message: TrackParams = {
      event,
      properties,
      ...this.getDefaults(),
    };
    try {
      await this.analyticsApi.track(message);
    } catch (err) {
      // TODO: Switch to use LOG from 
      LOG.error(`Error tracking event '${event}': `, err);
    }
  }

  /**
   * Page Event
   * @param name - Page name
   * @param properties - Optional page properties
   */
  public async page(name?: string, properties: EventProperties = {}): Promise<void> {
    properties.consent = CookieConsentServiceInstance.getConsentGroupsStatusString();
    const message: PageParams = {
      name,
      properties,
      ...this.getDefaults(),
    };
    try {
      await this.analyticsApi.page(message);
    } catch (err) {
      // TODO: Switch to use LOG from 
      LOG.error(`Error tracking page view '${name}': `, err);
    }
  }

  /**
   * Alias Event
   * @param userId - User ID
   * @param previousId - Previous ID
   */
  public async alias(userId: string, previousId: string): Promise<void> {
    const message: AliasParams = {
      userId,
      previousId,
      ...this.getDefaults(),
    };
    try {
      await this.analyticsApi.alias(message);
    } catch (err) {
      // TODO: Switch to use LOG from 
      LOG.error(`Error aliasing user '${userId}': `, err);
    }
  }

  /** Adds necessary default values to the given event data. */
  protected getDefaults(): EventDefaults {
    return {
      anonymousId: this.getAnonymousId(),
      context: {
        page: this.getPageContext(),
        userAgent: this.getUserAgentContext(),
      },
    };
  }

  /** Returns info about the current page, if available, for inclusion in an event. */
  protected getPageContext() {
    let path;
    let referrer;
    let search;
    let title;
    let url;
    if (document) {
      title = document.title;
      referrer = document.referrer;
      const location = window?.location;
      if (location) {
        path = location.pathname;
        search = location.search;
        url = location.href;
      }
    }
    return { path, referrer, search, title, url };
  }

  /** Returns the current user agent string for inclusion in an event. */
  protected getUserAgentContext(): string {
    return (navigator && navigator.userAgent) || '';
  }

  /** Generate (if needed) and return an ID for this user, used for analytics when the user can't otherwise be identified. */
  protected getAnonymousId(): string {
    // Use the analytics.js library's anonymous ID, if available, but make one up if we have to.
    let anonymousId = localStorage.getItem(LOCAL_STORAGE_KEY_ANONYMOUS_ID);
    if (!anonymousId) {
      anonymousId = `ta${Math.round(Math.random() * 1000000000000)}`;
      localStorage.setItem(LOCAL_STORAGE_KEY_ANONYMOUS_ID, `${anonymousId}`);
    }
    return anonymousId;
  }
}

const ANALYTICS = AnalyticsService.Instance;

export { ANALYTICS, AnalyticsService, ClientAnalyticsEvent };
