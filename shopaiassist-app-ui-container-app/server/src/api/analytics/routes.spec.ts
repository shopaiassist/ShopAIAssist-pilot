import { Analytics } from 'analytics-node';
import bodyParser from 'body-parser';
import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import sinon from 'sinon';

import { AnalyticsRoutes } from './routes';

export type Callback = (err?: unknown, ctx?: unknown) => void;

chai.use(chaiHttp);
const expect = chai.expect;

describe('Analytics routes', () => {
  let app: express.Express;
  let sandbox: sinon.SinonSandbox;
  let aliasSpy: sinon.SinonSpy, pageSpy: sinon.SinonSpy, trackSpy: sinon.SinonSpy, identifySpy: sinon.SinonSpy;

  before(() => {
    sandbox = sinon.createSandbox();

    aliasSpy = sandbox.spy(Analytics.prototype, 'alias');
    pageSpy = sandbox.spy(Analytics.prototype, 'page');
    identifySpy = sandbox.spy(Analytics.prototype, 'identify');
    trackSpy = sandbox.spy(Analytics.prototype, 'track');
  });

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use(AnalyticsRoutes.routes());
  });

  afterEach(() => {
    sandbox.reset();
  });

  after(() => {
    sandbox.restore();
  });

  describe(`POST ${AnalyticsRoutes.PATHS.ANALYTICS_TRACK}`, () => {
    it('should return 200', () => {
      return chai
        .request(app)
        .post(AnalyticsRoutes.PATHS.ANALYTICS_TRACK)
        .send({
          message: {
            event: 'Clicked Whats New',
            properties: { testProp: 'testValue' },
            anonymousId: 'ta736920549889',
            userId: '12345',
            context: {
              page: { path: '/', referrer: '', search: '', title: 'ShopAIAssist', url: 'http://localhost:8060/#' },
              userAgent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            },
          },
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(
            trackSpy.calledWith(
              sinon.match({
                event: 'Clicked Whats New',
                properties: { appType: 'app-shell', lowercaseEventName: 'clicked_whats_new', testProp: 'testValue' },
                anonymousId: 'ta736920549889',
                userId: '12345',
                context: {
                  page: { path: '/', referrer: '', search: '', title: 'ShopAIAssist', url: sinon.match.string },
                  userAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                },
              })
            ),
            `Unexpected calls to track(). Call arguments: ${JSON.stringify(
              trackSpy.getCalls().map((call) => call.args),
              null,
              2
            )}`
          ).to.be.true;
        });
    });
  });

  describe(`POST ${AnalyticsRoutes.PATHS.ANALYTICS_ALIAS}`, () => {
    it('should return 200', () => {
      return chai
        .request(app)
        .post(AnalyticsRoutes.PATHS.ANALYTICS_ALIAS)
        .send({ message: { previousId: '123', userId: '456', anonymousId: '789' } })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(aliasSpy.calledWith({ previousId: '123', userId: '456', anonymousId: '789' })).to.be.true;
        });
    });
  });

  describe(`POST ${AnalyticsRoutes.PATHS.ANALYTICS_IDENTIFY}`, () => {
    it('should return 200', () => {
      return chai
        .request(app)
        .post(AnalyticsRoutes.PATHS.ANALYTICS_IDENTIFY)
        .send({ message: { userId: '123', anonymousId: '456', traits: { firstName: 'Bob' } } })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(identifySpy.calledWith({ userId: '123', anonymousId: '456', traits: { firstName: 'Bob' } })).to.be
            .true;
        });
    });
  });

  describe(`POST ${AnalyticsRoutes.PATHS.ANALYTICS_PAGE}`, () => {
    it('should return 200', () => {
      return chai
        .request(app)
        .post(AnalyticsRoutes.PATHS.ANALYTICS_PAGE)
        .send({ message: { name: 'test page', properties: { testProp: 'testValue' } } })
        .then((res) => {
          // I've seen this occasionally fail with a 404 response locally, making me think we have an async issue in the
          // test setup somewhere.
          expect(res).to.have.status(200);
          expect(
            pageSpy.calledWith({
              name: 'test page',
              properties: { testProp: 'testValue' },
              integrations: { Mixpanel: false, Iterable: false, HubSpot: false },
            })
          ).to.be.true;
        });
    });
  });
});
