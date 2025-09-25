import bodyParser from 'body-parser';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import session from 'express-session';
import sinon from 'sinon';

import { LoggedInUser } from '../../lib/auth';
import { MOCK_LOGGED_IN_USER_1 } from '../auth/routes.spec';
import { UserRoutes } from './routes';

chai.use(chaiHttp);

describe('UserRoutes', () => {
  const MOCK_USER_PROFILE: LoggedInUser = MOCK_LOGGED_IN_USER_1;

  let app: express.Express;

  let sandbox: sinon.SinonSandbox;

  before(() => {
    sandbox = sinon.createSandbox();
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
    app.use('/api/user', UserRoutes.routes());
  });

  describe('GET /api/user/me', () => {
    it('should get user info', () => {
      sessionUser = MOCK_USER_PROFILE;
      return chai
        .request(app)
        .get('/api/user/me')
        .send()
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.deep.equal(MOCK_USER_PROFILE);
        });
    });

    it('should return 401 unauthorized', () => {
      sessionUser = undefined;
      return chai
        .request(app)
        .get('/api/user/me')
        .send()
        .then((res) => {
          expect(res.status).to.equal(401);
          expect(res.body).to.deep.equal({ message: 'No authorized user', code: 'no_authorized_user' });
        });
    });
  });
});
