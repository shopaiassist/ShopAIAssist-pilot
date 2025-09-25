import bodyParser from 'body-parser';
import chai from 'chai';
import chaiHttp from 'chai-http';
import express from 'express';
import sinon from 'sinon';

import { HealthRoutes } from './routes';

chai.use(chaiHttp);
const expect = chai.expect;

describe('ClientRoutes', () => {
  let app: express.Express;
  let sandbox: sinon.SinonSandbox;

  before(() => (sandbox = sinon.createSandbox()));

  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());

    app.use(HealthRoutes.routes());
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`GET ${HealthRoutes.PATHS.PING}`, () => {
    it('should return index page', () => {
      return chai
        .request(app)
        .get('/ping')
        .send()
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.deep.equal({
            status: 'Main server up!!!!',
          });
        });
    });
  });
});
