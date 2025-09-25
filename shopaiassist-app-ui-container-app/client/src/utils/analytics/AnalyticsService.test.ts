import { AnalyticsApi } from '../api/analytics';
import { AnalyticsService, ClientAnalyticsEvent } from './AnalyticsService';

describe('Analytics Service', () => {
  let service = AnalyticsService.Instance;
  let trackSpy: jest.SpyInstance, identifySpy: jest.SpyInstance, aliasSpy: jest.SpyInstance, pageSpy: jest.SpyInstance;

  beforeAll(() => {
    trackSpy = jest.spyOn(AnalyticsApi.prototype, 'track').mockResolvedValue();
    identifySpy = jest.spyOn(AnalyticsApi.prototype, 'identify').mockResolvedValue();
    aliasSpy = jest.spyOn(AnalyticsApi.prototype, 'alias').mockResolvedValue();
    pageSpy = jest.spyOn(AnalyticsApi.prototype, 'page').mockResolvedValue();

    service = AnalyticsService.Instance;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send track request', async () => {
    await service.track(ClientAnalyticsEvent.CLICKED_WHATS_NEW, { testProp: 'testValue' });
    expect(trackSpy).toHaveBeenCalledWith({
      event: 'Clicked Whats New',
      properties: { testProp: 'testValue', consent: '' },
      anonymousId: expect.any(String),
      context: {
        page: { path: '/', referrer: '', search: '', title: '', url: expect.any(String) },
        userAgent: expect.any(String),
      },
    });
  });

  it('should send identify request', async () => {
    await service.identify('user-1', { firstName: 'Bob', lastName: 'Bobber' });
    expect(identifySpy).toHaveBeenCalledWith({
      userId: 'user-1',
      traits: { firstName: 'Bob', lastName: 'Bobber' },
      anonymousId: expect.any(String),
      context: {
        page: { path: '/', referrer: '', search: '', title: '', url: expect.any(String) },
        userAgent: expect.any(String),
      },
    });
  });

  it('should send alias request', async () => {
    await service.alias('user-1', 'user-2');
    expect(aliasSpy).toHaveBeenCalledWith({
      userId: 'user-1',
      previousId: 'user-2',
      anonymousId: expect.any(String),
      context: {
        page: { path: '/', referrer: '', search: '', title: '', url: expect.any(String) },
        userAgent: expect.any(String),
      },
    });
  });

  it('should send page request', async () => {
    await service.page('page-1', { testProp: 'testValue' });
    expect(pageSpy).toHaveBeenCalledWith({
      name: 'page-1',
      properties: { testProp: 'testValue', consent: '' },
      anonymousId: expect.any(String),
      context: {
        page: { path: '/', referrer: '', search: '', title: '', url: expect.any(String) },
        userAgent: expect.any(String),
      },
    });
  });
});
