import Axios from 'axios';

import { AnalyticsApi } from './analytics';

describe('AnalyticsApi', () => {
  let analyticsApi: AnalyticsApi;

  beforeEach(() => {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    jest.spyOn(Axios, 'create').mockReturnValue({ post: jest.fn().mockReturnValue(Promise.resolve()) } as any);
    analyticsApi = new AnalyticsApi();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should call the alias endpoint with the correct data', async () => {
    const aliasParams = { userId: '123', previousId: '456' };
    const expectedEndpoint = '/alias';
    const expectedData = { message: aliasParams };

    await analyticsApi.alias(aliasParams);

    expect(analyticsApi['apiAnalytics'].post).toHaveBeenCalledWith(expectedEndpoint, expectedData);
  });

  it('should call the identify endpoint with the correct data', async () => {
    const identifyParams = { userId: '123', traits: { name: 'John Doe' } };
    const expectedEndpoint = '/identify';
    const expectedData = { message: identifyParams };

    await analyticsApi.identify(identifyParams);

    expect(analyticsApi['apiAnalytics'].post).toHaveBeenCalledWith(expectedEndpoint, expectedData);
  });

  it('should call the page endpoint with the correct data', async () => {
    const pageParams = { userId: '123', name: 'Home' };
    const expectedEndpoint = '/page';
    const expectedData = { message: pageParams };

    await analyticsApi.page(pageParams);

    expect(analyticsApi['apiAnalytics'].post).toHaveBeenCalledWith(expectedEndpoint, expectedData);
  });

  it('should call the track endpoint with the correct data', async () => {
    const trackParams = { userId: '123', event: 'Clicked Button' };
    const expectedEndpoint = '/track';
    const expectedData = { message: trackParams };

    await analyticsApi.track(trackParams);

    expect(analyticsApi['apiAnalytics'].post).toHaveBeenCalledWith(expectedEndpoint, expectedData);
  });
});
