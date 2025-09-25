import { expect } from 'chai';
import sinon from 'sinon';

import { Auth } from '../../lib/auth';
import { OnePass } from '../../lib/onepass';
import { CariAuthServiceClient } from './entitlement/feature-access/cari-auth/CariAuthServiceClient';
import { AuthService } from './service';

import mockAuthSignOnTokenResp from '../../lib/fixtures/auth-signon-token-response.json';
import createOrchTokenResp from '../../lib/fixtures/create-orchestration-token-response.json';
import mockQueryFeatureAccessControlsResp from '../../lib/fixtures/query-feature-access-controls-response.json';
import mockQueryOrgDetailsResp from '../../lib/fixtures/query-org-details-response.json';

describe('AuthService', () => {
  let sandbox: sinon.SinonSandbox;

  let authTokenSpy: sinon.SinonSpy;
  let createOrchSpy: sinon.SinonSpy;
  let generateUserJwtSpy: sinon.SinonSpy;
  let queryFeatureAccessControlsSpy: sinon.SinonSpy;
  let queryOrgDetailsSpy: sinon.SinonSpy;
  let queryUserGuidSpy: sinon.SinonSpy;

  const MOCK_ONEPASS_API_KEY = 'mock-api-key';
  const MOCK_ONEPASS_API_KEY_SECRET = 'mock-api-key-secret';
  const MOCK_ONEPASS_API_URL = 'http://mock-onepass';
  const MOCK_JWT_PRIVATE_KEY = 'mock-jwt-private-key';
  const MOCK_JWT = 'abc123';
  const MOCK_SIGN_ON_TOKEN = 'mock-sign-on-token';
  const MOCK_CARI_AUTH_SERVICE_URL = 'http://mock-cari-auth';

  const originalEnv = { ...process.env };

  before(() => {
    sandbox = sinon.createSandbox();
    process.env.ONEPASS_API_KEY = MOCK_ONEPASS_API_KEY;
    process.env.ONEPASS_API_KEY_SECRET = MOCK_ONEPASS_API_KEY_SECRET;
    process.env.ONEPASS_API_URL = MOCK_ONEPASS_API_URL;
    process.env.JWT_PRIVATE_KEY = MOCK_JWT_PRIVATE_KEY;
    process.env.CARI_AUTH_SERVICE_URL = MOCK_CARI_AUTH_SERVICE_URL;
  });

  after(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    authTokenSpy = sandbox
      .stub(OnePass.prototype, 'authenticateSignOnToken')
      .returns(Promise.resolve(mockAuthSignOnTokenResp));
    createOrchSpy = sandbox
      .stub(OnePass.prototype, 'createOrchestrationToken')
      .returns(Promise.resolve(createOrchTokenResp));
    generateUserJwtSpy = sandbox.stub(Auth.prototype, 'generateUserJwt').returns(Promise.resolve(MOCK_JWT));
    queryFeatureAccessControlsSpy = sandbox
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .stub((CariAuthServiceClient as any).prototype, 'queryFeatureAccessControls')
      .returns(Promise.resolve({ data: mockQueryFeatureAccessControlsResp }));
    queryOrgDetailsSpy = sandbox
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .stub((CariAuthServiceClient as any).prototype, 'queryOrgDetails')
      .returns(Promise.resolve({ data: mockQueryOrgDetailsResp }));
    queryUserGuidSpy = sandbox
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .stub((CariAuthServiceClient as any).prototype, 'queryUserGuid')
      .returns(Promise.resolve({ data: { UserGuid: 'i0a899a9c0000018f599c5e421aacc447' } }));
  });

  it('should authenticate a user', async () => {
    const service = new AuthService();
    const user = await service.loginUser(MOCK_SIGN_ON_TOKEN);

    expect(authTokenSpy.calledWith(MOCK_SIGN_ON_TOKEN)).to.be.true;

    expect(
      createOrchSpy.calledWith(
        mockAuthSignOnTokenResp.Profile.Identifier,
        mockAuthSignOnTokenResp.RegistrationKey,
        mockAuthSignOnTokenResp.SeamlessToken
      )
    ).to.be.true;
    expect(generateUserJwtSpy.calledWith(createOrchTokenResp.Token)).to.be.true;
    expect(queryFeatureAccessControlsSpy.called).to.be.true;
    expect(queryOrgDetailsSpy.called).to.be.true;
    expect(queryUserGuidSpy.called).to.be.true;

    const { EmailAddress, FirstName, LastName } = mockAuthSignOnTokenResp.Profile;
    expect(user).to.deep.equal({
      orchestrationToken: createOrchTokenResp.Token,
      user: {
        email: EmailAddress,
        firstName: FirstName,
        lastName: LastName,
        userGuid: 'i0a899a9c0000018f599c5e421aacc447',
        registrationKey: mockAuthSignOnTokenResp.RegistrationKey,
        organization: {
          id: '1004637433',
          locationCountryCode: 'US',
        },
      },
      bannerAndGuideMetadata: {
        account: {
          id: '1004637433',
          paymentGroupNumber: '1004637433',
        },
        visitor: {
          id: 'fake-8f4e2bc55f2ff3e4123b70790e4bc5faf0ab3b23',
          prismid: 'i0a899a9c0000018f599c5e421aacc447',
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
      jwt: MOCK_JWT,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });
});
