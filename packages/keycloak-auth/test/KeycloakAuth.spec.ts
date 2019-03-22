import * as nock from 'nock';
import { KeycloakAuth } from '../src';

const response = {
  access_token: 'access-1',
  expires_in: 1,
  refresh_expires_in: 2,
  refresh_token: 'refresh-1',
  token_type: 'bearer',
  'not-before-policy': 1508951547,
  session_state: '72ea6748-9ffa-4a2d-8431-71b0c563aeae',
  scope: 'email profile',
};

describe('Integration test', () => {
  it('Should ', async () => {
    nock('http://auth')
      .post(
        '/auth/realms/ovo-energy/protocol/openid-connect/token',
        'grant_type=client_credentials&client_id=test-portal&client_secret=11-22-33',
      )
      .times(2)
      .reply(200, response);

    nock('http://auth')
      .post(
        '/auth/realms/ovo-energy/protocol/openid-connect/token',
        'grant_type=refresh_token&client_id=test-portal&client_secret=11-22-33&refresh_token=refresh-1',
      )

      .reply(200, response);

    const auth = new KeycloakAuth({
      serverUrl: 'http://auth',
      clientId: 'test-portal',
      clientSecret: '11-22-33',
      margin: 0,
    });

    await auth.authenticate();
    await auth.authenticate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await auth.authenticate();
    await auth.authenticate();
    await new Promise(resolve => setTimeout(resolve, 3000));
    await auth.authenticate();
    await auth.authenticate();
  });
});
