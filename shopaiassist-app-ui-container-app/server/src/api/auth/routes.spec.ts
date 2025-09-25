import bodyParser from 'body-parser';
import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import session, { MemoryStore } from 'express-session';
import nock from 'nock';
import sinon from 'sinon';

import { UserRoutes } from '../user/routes';
import { AuthRoutes } from './routes';
import { AuthService } from './service';

import mockAuthSignOnTokenResp from '../../lib/fixtures/auth-signon-token-response.json';
import mockCreateOrchTokenResp from '../../lib/fixtures/create-orchestration-token-response.json';
import mockQueryFeatureAccessControlsResp from '../../lib/fixtures/query-feature-access-controls-response.json';
import mockQueryOrgDetailsResp from '../../lib/fixtures/query-org-details-response.json';

chai.use(chaiHttp);
const expect = chai.expect;

export const MOCK_LOGGED_IN_USER_1 = {
  user: {
    email: 'mock-test@.com',
    firstName: 'Mock',
    lastName: 'Test',
    userGuid: 'mock-4b4d87956ba84e2c847d',
    registrationKey: '1234567-ABCDEF1',
    organization: {
      id: '01234567890',
      locationCountryCode: 'US',
    },
  },
  permissions: {
    isAdmin: false,
    skills: { allowedSkills: [] },
    fileManagement: { canViewDatabases: true, canCreateDatabases: false, canShareDatabases: false },
  },
  bannerAndGuideMetadata: {
    visitor: { id: 'mock-23425778215235234234ksad02' },
    account: { id: '01234567890' },
  },
  orchestrationToken: 'mock-0610241122060nHCOBZu...',
  jwt: 'mock',
};

describe('AuthRoutes', () => {
  const MOCK_ONEPASS_API_KEY = 'mock-api-key';
  const MOCK_ONEPASS_API_KEY_SECRET = 'mock-api-key-secret';
  const MOCK_ONEPASS_API_URL = 'http://mock-onepass';
  const MOCK_JWT_PRIVATE_KEY = 'mock-jwt-private-key';
  const MOCK_CARI_AUTH_SERVICE_URL = 'http://mock-cari-auth';

  let app: express.Express;
  let sessionStore: MemoryStore;

  let sandbox: sinon.SinonSandbox;

  let loginUserSpy: sinon.SinonSpy;

  const originalEnv = { ...process.env };

  before(() => {
    sandbox = sinon.createSandbox();
    process.env.ONEPASS_API_KEY = MOCK_ONEPASS_API_KEY;
    process.env.ONEPASS_API_KEY_SECRET = MOCK_ONEPASS_API_KEY_SECRET;
    process.env.ONEPASS_API_URL = MOCK_ONEPASS_API_URL;
    process.env.JWT_PRIVATE_KEY = MOCK_JWT_PRIVATE_KEY;
    process.env.CARI_AUTH_SERVICE_URL = MOCK_CARI_AUTH_SERVICE_URL;
    process.env.TEMP_ENABLE_AUTHORIZATION = 'true';
  });

  after(() => {
    process.env = originalEnv;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('with AuthService mock', () => {
    beforeEach(() => {
      loginUserSpy = sandbox.stub(AuthService.prototype, 'loginUser').returns(Promise.resolve(MOCK_LOGGED_IN_USER_1));
      app = express();
      app.use(bodyParser.json());
      sessionStore = new MemoryStore();
      app.use(
        session({
          saveUninitialized: false, // don't create session until something stored
          resave: false, //don't save session if unmodified
          secret: 'unit-test',
          store: sessionStore,
        })
      );
      app.use('/api/auth', AuthRoutes.routes());
      // We break isolation of this test a bit and include UserRoutes, so we can use /api/user/me after login.
      app.use('/api/user', UserRoutes.routes());
    });

    describe('GET /api/auth/onepass', () => {
      beforeEach(() => {
        sessionStore.all(
          (err, sessions) => sessions && Object.keys(sessions).forEach((key) => sessionStore.destroy(key, () => {}))
        );
      });

      it('should set an auth cookie', () => {
        return chai
          .request(app)
          .get('/api/auth/onepass?signontoken=mock')
          .send()
          .redirects(0)
          .then((res) => {
            expect(res.status).to.equal(302);
            expect(res.headers.location).to.include('/');
            expect(res).to.have.cookie('connect.sid'); // <-- Makes sure the session that stores the user profile was initialized
            expect(loginUserSpy.calledWith('mock')).to.be.true;
          });
      });

      it('should respond with 400 if signOn token was not passed', () => {
        return chai
          .request(app)
          .get('/api/auth/onepass')
          .send()
          .then((res) => {
            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ error: 'Missing signontoken query param' });
            expect(loginUserSpy.called).to.be.false;
          });
      });

      it('should respond with 400 if multiple signOn tokens were passed', () => {
        return chai
          .request(app)
          .get('/api/auth/onepass?signontoken=a&signontoken=b')
          .send()
          .then((res) => {
            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ error: 'signontoken query param value must be a string' });
            expect(loginUserSpy.called).to.be.false;
          });
      });
    });
  });

  describe('with only external services mocked', () => {
    let checkPermissionInterceptor: nock.Interceptor;

    beforeEach(() => {
      // Next we mock the sequence of external API calls that will be made in the happy path of logging in.
      // 1. the SignOn Token is validated and a Seamless Token is generated.
      nock(MOCK_ONEPASS_API_URL).post(`/onepass/v3/authenticate/signontoken`).reply(200, mockAuthSignOnTokenResp);
      // 2. the Seamless Token is used to generate a preliminary Orchestration Token.
      nock(MOCK_ONEPASS_API_URL)
        .post('/onepass/v3/create/orchestrationtoken')
        .once()
        .reply(200, mockCreateOrchTokenResp);
      // 3. the preliminary Orchestration Token is used to check user permissions.
      checkPermissionInterceptor = nock(MOCK_CARI_AUTH_SERVICE_URL).post('/api/v1/check-permission');
      checkPermissionInterceptor.reply(200, mockQueryFeatureAccessControlsResp);
      // 4. the preliminary Orchestration Token is used to further identify the user.
      nock(MOCK_CARI_AUTH_SERVICE_URL)
        .get('/api/v1/user-guid')
        .reply(200, { UserGuid: 'i0a899a9c0000018f599c5e421aacc447' });
      // 5. the preliminary Orchestration Token is used to get details about the user's organization.
      nock(MOCK_CARI_AUTH_SERVICE_URL).get('/api/v1/org-details').times(1).reply(200, mockQueryOrgDetailsResp);
      // 6. the Seamless Token is used to generate a final Orchestration Token, which includes user, org, and permission
      //    associated with the token.
      nock(MOCK_ONEPASS_API_URL)
        .post('/onepass/v3/create/orchestrationtoken')
        .once()
        .reply(200, { ...mockCreateOrchTokenResp, Token: 'fake-second-token-created-417c79b52' });
    });

    afterEach(() => {
      nock.abortPendingRequests();
      nock.cleanAll();
    });

    it('should log in a happy-path user', async () => {
      const agent = chai.request.agent(app);
      try {
        // When OnePass calls us, and all the subsequent calls to external services succeed, we should have an access token.
        const loginResponse = await agent.get('/api/auth/onepass?signontoken=mock').send().redirects(0);
        expect(loginResponse.status).to.equal(302);
        expect(loginResponse.headers.location).to.include('/');
        expect(loginResponse).to.have.cookie('connect.sid');

        const userResponse = await agent.get('/api/user/me').send().redirects(0);
        expect(userResponse.body).to.deep.include({
          orchestrationToken: 'fake-second-token-created-417c79b52',
          user: {
            email: 'unit-test@example.com',
            firstName: 'Benjamin',
            lastName: 'Albert',
            userGuid: 'i0a899a9c0000018f599c5e421aacc447',
            registrationKey: '123456-SEVEN',
            organization: {
              id: '1004637433',
              locationCountryCode: 'US',
            },
          },
          permissions: {
            fileManagement: {
              canCreateDatabases: true,
              canShareDatabases: false,
              canViewDatabases: true,
            },
            isAdmin: false,
            skills: {
              allowedSkills: ['summarize', 'sdb', 'review_documents', 'draft_correspondence', 'westlaw_research'],
            },
            infrastructureRegion: 'US',
          },
        });
        expect(userResponse.body.jwt).to.be.a('string');
      } finally {
        agent.close();
      }
    });

    it('should redirect authenticated users who are not authorized', async () => {
      // Replace the /check-permission interceptor with one that returns the same data except WITHOUT the 'Grant' for
      // US access to ShopAIAssist Core. Without it, the user should not be allowed to log in, and should get redirected
      // to /no-access.html instead.
      nock.removeInterceptor(checkPermissionInterceptor);
      checkPermissionInterceptor = nock(MOCK_CARI_AUTH_SERVICE_URL).post('/api/v1/check-permission');
      checkPermissionInterceptor.reply(200, {
        featurePermissions: [
          {
            feature: 'APPLICATION',
            resourcePermissions: [
              ...mockQueryFeatureAccessControlsResp.featurePermissions[0].resourcePermissions.filter(
                (rp) => rp.resource !== 'PRDCT ShopAIAssistCORE US'
              ),
              { resource: 'PRDCT ShopAIAssistCORE US', permission: 'Deny' },
            ],
          },
        ],
      });

      const agent = chai.request.agent(app);
      try {
        // When OnePass calls us, and all the subsequent calls to external services succeed, we should have an access token.
        const loginResponse = await agent.get('/api/auth/onepass?signontoken=mock').send().redirects(0);
        expect(loginResponse.status).to.equal(302);
        expect(loginResponse.headers.location).to.include('/no-access.html');
        expect(loginResponse).not.to.have.cookie('connect.sid');

        const userResponse = await agent.get('/api/user/me').send().redirects(0);
        expect(userResponse.status).to.equal(401);
      } finally {
        agent.close();
      }
    });
  });
});
