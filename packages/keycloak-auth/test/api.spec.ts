import * as nock from 'nock';
import { authenticate, isExpired, KeycloakAuthError, login } from '../src';

const response = {
  access_token: 'access-1',
  expires_in: 1,
  refresh_expires_in: 2,
  refresh_token: 'refresh-1',
  token_type: 'bearer',
  'not-before-policy': 1508951547,
  session_state: 'test-1',
  scope: 'email profile',
};

describe('Api test', () => {
  it.each`
    expires | timestamp | margin | expected
    ${10}   | ${5}      | ${0}   | ${false}
    ${10}   | ${10}     | ${0}   | ${true}
    ${10}   | ${5}      | ${5}   | ${true}
    ${10}   | ${5}      | ${3}   | ${false}
    ${10}   | ${10}     | ${3}   | ${true}
  `(
    'Test if Expires $expires from Date $timestamp with Margin $margin is expired? $expected',
    ({ expires, timestamp, margin, expected }) => {
      expect(isExpired(expires, timestamp, margin)).toBe(expected);
    },
  );

  it('should process error from jsonFetch', async () => {
    nock('http://auth')
      .post(
        '/auth/realms/my-realm/protocol/openid-connect/token',
        'grant_type=client_credentials&client_id=test-portal&client_secret=11-22-33',
      )
      .reply(400, { error: 'unauthenticated_client', error_description: 'We have a problem' });

    const loginResponse = login({
      serverUrl: 'http://auth/auth/realms/my-realm/protocol/openid-connect/token',
      clientId: 'test-portal',
      clientSecret: '11-22-33',
    });

    await expect(loginResponse).rejects.toEqual(new KeycloakAuthError('We have a problem', 'unauthenticated_client'));
  });

  it('Should call appropriate endpoints', async () => {
    nock('http://auth')
      .post(
        '/auth/realms/my-realm/protocol/openid-connect/token',
        'grant_type=client_credentials&client_id=test-portal&client_secret=11-22-33',
      )
      .reply(200, response);

    nock('http://auth')
      .post(
        '/auth/realms/my-realm/protocol/openid-connect/token',
        'grant_type=refresh_token&client_id=test-portal&client_secret=11-22-33&refresh_token=refresh-1',
      )
      .reply(200, { ...response, refresh_token: 'refresh-2', access_token: 'access-2' });

    nock('http://auth')
      .post(
        '/auth/realms/my-realm/protocol/openid-connect/token',
        'grant_type=client_credentials&client_id=test-portal&client_secret=11-22-33',
      )
      .reply(200, { ...response, refresh_token: 'refresh-3', access_token: 'access-3', session_state: 'test-2' });

    const params = {
      serverUrl: 'http://auth/auth/realms/my-realm/protocol/openid-connect/token',
      clientId: 'test-portal',
      clientSecret: '11-22-33',
      margin: 0,
    };

    const response1 = await authenticate(params);
    const response2 = await authenticate({ ...params, previous: response1 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response3 = await authenticate({ ...params, previous: response2 });
    const response4 = await authenticate({ ...params, previous: response3 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const response5 = await authenticate({ ...params, previous: response4 });
    const response6 = await authenticate({ ...params, previous: response5 });

    expect(response1).toEqual(expect.objectContaining({ accessToken: 'access-1', refreshToken: 'refresh-1' }));
    expect(response2).toEqual(expect.objectContaining({ accessToken: 'access-1', refreshToken: 'refresh-1' }));
    expect(response3).toEqual(expect.objectContaining({ accessToken: 'access-2', refreshToken: 'refresh-2' }));
    expect(response4).toEqual(expect.objectContaining({ accessToken: 'access-2', refreshToken: 'refresh-2' }));
    expect(response5).toEqual(expect.objectContaining({ accessToken: 'access-3', refreshToken: 'refresh-3' }));
    expect(response6).toEqual(expect.objectContaining({ accessToken: 'access-3', refreshToken: 'refresh-3' }));
  });

  it('Should handle token errors', async () => {
    nock('http://auth')
      .post(
        '/auth/realms/my-realm/protocol/openid-connect/token',
        'grant_type=client_credentials&client_id=test-portal&client_secret=11-22-33',
      )
      .times(2)
      .reply(200, response);

    nock('http://auth')
      .post(
        '/auth/realms/my-realm/protocol/openid-connect/token',
        'grant_type=refresh_token&client_id=test-portal&client_secret=11-22-33&refresh_token=refresh-1',
      )

      .reply(400, { message: 'Wrong token' });

    const params = {
      serverUrl: 'http://auth/auth/realms/my-realm/protocol/openid-connect/token',
      clientId: 'test-portal',
      clientSecret: '11-22-33',
      margin: 0,
    };

    const response1 = await authenticate(params);
    const response2 = await authenticate({ ...params, previous: response1 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response3 = await authenticate({ ...params, previous: response2 });
    await authenticate({ ...params, previous: response3 });
  });
});
