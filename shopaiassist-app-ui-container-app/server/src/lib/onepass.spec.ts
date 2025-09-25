import { expect } from 'chai';
import nock from 'nock';

import { OnePass } from './onepass';

import mockAuthSignOnTokenResp from './fixtures/auth-signon-token-response.json';
import createOrchTokenResp from './fixtures/create-orchestration-token-response.json';

describe('OnePass REST client', () => {
  const MOCK_ONEPASS_API_KEY = 'mock-api-key';
  const MOCK_ONEPASS_API_KEY_SECRET = 'mock-api-key-secret';
  const MOCK_ONEPASS_API_URL = 'http://mock-onepass';

  const BASE_PATH = '/onepass/v3';
  const AUTH_SIGNON_TOKEN_PATH = '/authenticate/signontoken';
  const CREATE_ORCHESTRATION_TOKEN_PATH = '/create/orchestrationtoken';

  const MOCK_SIGNON_TOKEN = 'mock-signon-token';
  const MOCK_SEAMLESS_TOKEN = 'mock-seamless-token';

  const originalEnv = { ...process.env };

  before(() => {
    process.env.ONEPASS_API_KEY = MOCK_ONEPASS_API_KEY;
    process.env.ONEPASS_API_KEY_SECRET = MOCK_ONEPASS_API_KEY_SECRET;
    process.env.ONEPASS_API_URL = MOCK_ONEPASS_API_URL;

    nock(MOCK_ONEPASS_API_URL).post(`${BASE_PATH}${AUTH_SIGNON_TOKEN_PATH}`).reply(200, mockAuthSignOnTokenResp);

    nock(MOCK_ONEPASS_API_URL).post(`${BASE_PATH}${CREATE_ORCHESTRATION_TOKEN_PATH}`).reply(200, createOrchTokenResp);
  });

  after(() => {
    process.env = originalEnv;
  });

  after(() => {
    nock.abortPendingRequests();
    nock.cleanAll();
  });

  it('authenticates a signOn token', async () => {
    const onePass = new OnePass();
    const resp = await onePass.authenticateSignOnToken(MOCK_SIGNON_TOKEN);
    expect(resp).to.deep.equal(mockAuthSignOnTokenResp);
  });

  it('creates an orchestration token', async () => {
    const onePass = new OnePass();
    const resp = await onePass.createOrchestrationToken('mock-user-id', '12345-SIXTH', MOCK_SEAMLESS_TOKEN);
    expect(resp).to.deep.equal(createOrchTokenResp);
  });
});
