import bodyParser from 'body-parser';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import session from 'express-session';
import nock from 'nock';
import sinon from 'sinon';

import { LoggedInUser } from '../../lib/auth';
import { MOCK_LOGGED_IN_USER_1 } from '../auth/routes.spec';
import { EmailRoutes } from './routes';

chai.use(chaiHttp);

describe('EmailRoutes', () => {
  const MOCK_USER_PROFILE: LoggedInUser = MOCK_LOGGED_IN_USER_1;
  const MOCK_APP_DOMAIN = 'https://';
  const MOCK_EMAIL_SECRET = '';
  const MOCK_ITERABLE_URL = 'https://example.com/api';
  const MOCK_ITERABLE_API_KEY = '';
  const MOCK_ITERABLE_SKILL_COMPLETE_CAMPAIGN_ID = '';

  let app: express.Express;

  let sandbox: sinon.SinonSandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    process.env.APP_DOMAIN = MOCK_APP_DOMAIN;
    process.env.EMAIL_SECRET = MOCK_EMAIL_SECRET;
    process.env.ITERABLE_API_URL = MOCK_ITERABLE_URL;
    process.env.ITERABLE_API_KEY = MOCK_ITERABLE_API_KEY;
    process.env.ITERABLE_SKILL_COMPLETE_CAMPAIGN_ID = MOCK_ITERABLE_SKILL_COMPLETE_CAMPAIGN_ID;
  });

  afterEach(() => {
    sandbox.restore();
  });

  let sessionUser: LoggedInUser | undefined = undefined;

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use(
      session({
        saveUninitialized: false, // don't create session until something stored
        resave: false, //don't save session if unmodified
        secret: 'unit-test',
      })
    );
    app.use((req, res, next) => {
      req.session.user = sessionUser;
      next();
    });
    app.use('/api/email', EmailRoutes.routes());
  });

  describe('GET /api/email/secure-url', () => {
    it('should get the secure URL', () => {
      sessionUser = MOCK_USER_PROFILE;
      return chai
        .request(app)
        .get('/api/email/secure-url')
        .query({ skillId: 'summarize', flowId: 'abcd12456' })
        .send()
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.url).to.equal(
            'https://example.com/'
          );
        });
    });

    it('should return 400 for missing param', () => {
      sessionUser = MOCK_USER_PROFILE;
      return chai
        .request(app)
        .get('/api/email/secure-url')
        .query({ skillId: 'summarize' })
        .send()
        .then((res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.deep.equal({
            message: 'Missing required parameter',
            code: 'missing_required_parameter',
          });
        });
    });

    it('should return 401 unauthorized', () => {
      sessionUser = undefined;
      return chai
        .request(app)
        .get('/api/email/secure-url')
        .query({ skillId: 'summarize', flowId: 'abcd12456' })
        .send()
        .then((res) => {
          expect(res.status).to.equal(401);
          expect(res.body).to.deep.equal({
            message: 'No authorized user',
            code: 'no_authorized_user',
          });
        });
    });
  });

  describe('POST /api/email/skill-notification', () => {
    afterEach(() => {
      nock.abortPendingRequests();
      nock.cleanAll();
    });

    it('should send the skill complete email', () => {
      nock(MOCK_ITERABLE_URL).post('/email/target').reply(200, { msg: 'Email sent' });

      sessionUser = undefined;
      return chai
        .request(app)
        .post(
          '/api/email/'
        )
        .send({})
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.deep.equal({
            success: true,
            message: 'Email sent',
          });
        });
    });

    it('should handle Iterable request failures', () => {
      nock(MOCK_ITERABLE_URL).post('/email/target').reply(400, { message: 'Bad request' });

      sessionUser = undefined;
      return chai
        .request(app)
        .post(
          '/api/email/'
        )
        .send({})
        .then((res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.deep.equal({
            success: false,
            message: 'Request failed with status code 400',
            code: 'email_send_error',
          });
        });
    });

    it('should handle invalid hash', () => {
      nock(MOCK_ITERABLE_URL).post('/email/target').reply(200, { msg: 'Email sent' });

      sessionUser = undefined;
      return chai
        .request(app)
        .post(
          '/api/email/'
        )
        .send({})
        .then((res) => {
          expect(res.status).to.equal(401);
          expect(res.body).to.deep.equal({
            message: 'Unauthorized request',
            code: 'invalid_secure_hash',
          });
        });
    });

    it('should handle missing parameters', () => {
      nock(MOCK_ITERABLE_URL).post('/email/target').reply(200, { msg: 'Email sent' });

      sessionUser = undefined;
      return chai
        .request(app)
        .post(
          '/api/email/'
        )
        .send({})
        .then((res) => {
          expect(res.status).to.equal(400);
          expect(res.body).to.deep.equal({
            message: 'Missing required parameter',
            code: 'missing_required_parameter',
          });
        });
    });
  });
});
