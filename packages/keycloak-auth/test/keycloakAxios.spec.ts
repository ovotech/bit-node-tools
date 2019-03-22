import axios from 'axios';
import * as nock from 'nock';
import { keycloakAxios } from '../src';

describe('Integration test', () => {
  it('Should ', async () => {
    nock('http://service')
      .options('/test')
      .times(2)
      .reply(
        200,
        {},
        {
          'Access-Control-Allow-Origin': 'http://localhost',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
      );

    nock('http://service')
      .matchHeader('Authorization', 'Bearer access-1')
      .get('/test')
      .times(2)
      .reply(200, { ok: true });

    nock('http://auth')
      .post(
        '/auth/realms/ovo-energy/protocol/openid-connect/token',
        'grant_type=client_credentials&client_id=test-portal&client_secret=11-22-33',
      )
      .reply(200, {
        access_token: 'access-1',
        expires_in: 60,
        refresh_expires_in: 1800,
        refresh_token: 'refresh-1',
        token_type: 'bearer',
        'not-before-policy': 1508951547,
        session_state: '72ea6748-9ffa-4a2d-8431-71b0c563aeae',
        scope: 'email profile',
      });

    const api = axios.create({ baseURL: 'http://service' });
    const auth = keycloakAxios({
      serverUrl: 'http://auth',
      clientId: 'test-portal',
      clientSecret: '11-22-33',
      margin: 12,
    });

    api.interceptors.request.use(auth);

    await api.get('/test');
    await api.get('/test');
  });
});
