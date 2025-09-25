import { LOG } from 'react';
import { CoreOptions } from 'a/analytics-core';
import { AliasParams, Analytics, Context, IdentifyParams, PageParams, TrackParams } from '@segment/analytics-node';
import Flat from 'flat';

export class AnalyticsService {
  private underlyingAnalytics: Analytics;

  constructor(analyticsApiKey: string | null = null) {
    const writeKey = analyticsApiKey || process.env.SEGMENT_KEY || 'test_key';
    this.underlyingAnalytics = new Analytics({ writeKey });
  }

  flush() {
    this.underlyingAnalytics.flush();
  }

  /**
   * Alias events are used to merge two user identities, effectively connecting two sets of user data as one.
   * @param message - AliasParams
   */
  async alias(message: AliasParams): Promise<unknown | Context> {
    this.modifyIntegrations(message);
    const promise = new Promise((resolve, reject) => {
      this.underlyingAnalytics.alias(message, (err, ctx) => {
        if (err) {
          reject(err);
        } else {
          resolve(ctx);
        }
      });
    });
    return promise;
  }

  /**
   * Identify calls tie a user to their actions and record traits about them.
   * @param message - IdentifyParams
   */
  async identify(message: IdentifyParams): Promise<unknown | Context> {
    this.modifyIntegrations(message);
    const promise = new Promise((resolve, reject) => {
      this.underlyingAnalytics.identify(this.formatIdentifyMessage(message), (err, ctx) => {
        if (err) {
          reject(err);
        } else {
          resolve(ctx);
        }
      });
    });
    return promise;
  }

  /**
   * Page calls track page views on your website, along with optional extra information about the page being viewed.
   * @param message - PageParams
   */
  async page(message: PageParams): Promise<unknown | Context> {
    this.modifyIntegrations(message);
    const promise = new Promise((resolve, reject) => {
      this.underlyingAnalytics.page(message, (err, ctx) => {
        if (err) {
          reject(err);
        } else {
          resolve(ctx);
        }
      });
    });
    return promise;
  }

  /**
   * Track calls track any actions your users perform.
   * @param message - TrackParams
   */
  async track(message: TrackParams): Promise<unknown | Context> {
    const doTrack = () => {
      this.modifyIntegrations(message);
      const promise = new Promise((resolve, reject) => {
        this.underlyingAnalytics.track(this.formatTrackMessage(message), (err, ctx) => {
          if (err) {
            reject(err);
          } else {
            resolve(ctx);
          }
        });
      });
      return promise;
    };

    if (message.userId) {
      // We asynchronously look up extra user info (like subscriptions) before tracking this message.
      this.loadExtraUserData(message.userId)
        .then((extraUserData: Record<string, unknown>) => {
          this.addExtraUserDataToMessage(message, extraUserData);
          try {
            return doTrack();
          } catch (err) {
            // analytics-node validation has failed, so we log it and move on.
            LOG.error(`Error tracking event '${message.event}' for user ${message.userId}: `, err);
          }
        })
        .catch((err) => {
          LOG.warn(
            `Could not look up subscription info for user ${message.userId} when tracking event '${message.event}'.`,
            err
          );
          // We couldn't look up the user's subscription info, but we still want to track what we can without it.
          return doTrack();
        });
    } else {
      // This case only happens when the session has an anonymousId instead of a userId.
      return doTrack();
    }
  }

  /** Flattens out `traits` properties.  See `formatTrackMessage()` for specifics. */
  protected formatIdentifyMessage(rawMessage: IdentifyParams): IdentifyParams {
    const formattedMessage = { ...rawMessage };
    if (formattedMessage.traits) {
      this.removeSensitiveData(formattedMessage.traits);
      formattedMessage.traits = {
        ...formattedMessage.traits,
        ...Flat.flatten(rawMessage.traits, { safe: true, delimiter: '_' }),
      };
    }
    return formattedMessage;
  }

  /**
   * Prepares the given message for publishing to external systems, specifically, ensures that any nested `properties` are flattened.
   *
   * For example:
   *
   *     {
   *       'status': {
   *         'planType': 'Self-serve',
   *         'account': 'active'
   *       }
   *     }
   *
   * will be 'flattened' to:
   *
   *     {
   *       'status_planType': 'Self-serve',
   *       'status_account': 'active',
   *       'status': {
   *         'planType': 'Self-serve',
   *         'account': 'active'
   *       }
   *     }
   */
  protected formatTrackMessage(rawMessage: TrackParams): TrackParams {
    const formattedMessage = { ...rawMessage };
    if (formattedMessage.properties) {
      formattedMessage.properties = {
        appType: 'app-shell',
        lowercaseEventName: rawMessage.event.toLowerCase().replace(/\s+/g, '_'),
        ...formattedMessage.properties,
        ...Flat.flatten(rawMessage.properties, { safe: true, delimiter: '_' }),
      };
    }
    return formattedMessage;
  }

  /**
   * Asynchronously loads the extra user data (e.g. subscriptions, user info) we want to include in our tracking data.
   *
   * @param userId the UID of the user.
   * @return the loaded extra data.
   */
  protected async loadExtraUserData(userId: string | number): Promise<Record<string, unknown>> {
    if (userId) {
      // Load the extra user data (subscriptions) from the database.
      return {};
    } else {
      // throw new Error('A userId is required.');
      return { userId: 'anonymous' };
    }
  }

  /**
   * Merges the extra user data (subscriptions) into the given message data.
   *
   * @param message
   * @param extraUserData
   */
  protected addExtraUserDataToMessage(message: TrackParams, extraUserData: Record<string, unknown>): void {
    if (message.properties) {
      // We have some events that send out emails to specified email addresses.
      //   ie 'Logged Out User Document Alert', 'Logged Out User Print PDF', 'Logged Out User Download PDF',
      //    'Logged Out User Share PDF', 'Logged In User Share PDF', 'Logged Out User Unlock Path'
      // In these cases, we DO NOT want to overwrite the email passed in with the user data email. So
      // we make sure anything passed in from the message takes precedence.
      // Sales/Product is aware of this and will filter out such events from HubSpot, not to skew data.
      message.properties = { ...extraUserData, ...message.properties };
    } else {
      message.properties = extraUserData;
    }
  }

  /** Modifies Segment integrations (currently only used to disable Mixpanel, Iterable, and HubSpot for some users) */
  protected modifyIntegrations(message: CoreOptions): void {
    // Missing uid only happens via EventAPI, when a client-side event is being tunnelled through
    // the server-side, and the session has an anonymousId instead of a userId.
    if (!!message && !message.userId) {
      if (!message.integrations) {
        message.integrations = {};
      }
      message.integrations.Mixpanel = false;
      message.integrations.Iterable = false;
      message.integrations.HubSpot = false;
    }
  }

  /** Remove any data that shouldn't get sent to 3rd party apps */
  protected removeSensitiveData(data?: Record<string, unknown>): void {
    if (data) {
      delete data.$saved;
      delete data.access;
    }
  }
}
