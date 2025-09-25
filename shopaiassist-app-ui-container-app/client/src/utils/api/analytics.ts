import { AliasParams, IdentifyParams, PageParams, TrackParams } from '@segment/analytics-node';
import Axios from 'axios';

import { apiError } from './index';

const ENDPOINTS = {
  ANALYTICS_ALIAS: '/alias',
  ANALYTICS_IDENTIFY: '/identify',
  ANALYTICS_PAGE: '/page',
  ANALYTICS_TRACK: '/track',
};

export class AnalyticsApi {
  private apiAnalytics = Axios.create({ baseURL: '/api/analytics' });

  private handleError(error: Error) {
    apiError('AnalyticsApi', error);
  }

  alias(message: AliasParams) {
    return this.apiAnalytics.post(ENDPOINTS.ANALYTICS_ALIAS, { message }).catch(this.handleError);
  }

  identify(message: IdentifyParams) {
    return this.apiAnalytics.post(ENDPOINTS.ANALYTICS_IDENTIFY, { message }).catch(this.handleError);
  }

  page(message: PageParams) {
    return this.apiAnalytics.post(ENDPOINTS.ANALYTICS_PAGE, { message }).catch(this.handleError);
  }

  track(message: TrackParams) {
    return this.apiAnalytics.post(ENDPOINTS.ANALYTICS_TRACK, { message }).catch(this.handleError);
  }
}
