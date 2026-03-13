import axios from 'axios';
import * as nock from 'nock';
import { KeycloakAuth, keycloakAxios } from '../src';

const clientId = 'client-id';
const clientSecret = 'client-secret';
const authBaseURL = 'http://auth.test/auth/realms/my-realm/protocol/openid-connect/token';
const serviceBaseURL = 'http://service.test';

/**
 * When axios sends a request with a custom header (like Authorization) an initial OPTIONS request
 * is sent to verify CORS permissions. This mock intercepts that OPTIONS request and returns the
 * necessary Allow headers.
 */
const handleOptionsPreflight = (times = 2) => {
  nock(serviceBaseURL)
    .options('/test')
    .times(times)
    .reply(
      200,
      {},
      {
        'Access-Control-Allow-Origin': 'http://localhost',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    );
};

describe('Integration test', () => {
  beforeEach(() => {
    handleOptionsPreflight();

    nock(serviceBaseURL)
      .matchHeader('Authorization', 'Bearer access-1')
      .get('/test')
      .times(2)
      .reply(200, { ok: true });

    nock(authBaseURL)
      .post('', `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`)
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
  });

  it('Should take a config object turn it into a usable axios interceptor', async () => {
    const api = axios.create({ baseURL: serviceBaseURL });
    const authInterceptor = keycloakAxios({
      serverUrl: authBaseURL,
      clientId,
      clientSecret,
      margin: 12,
    });

    api.interceptors.request.use(authInterceptor);

    await api.get('/test');
    await api.get('/test');
  });

  it('Should take a keycloak object turn it into a usable axios interceptor', async () => {
    const authObject = new KeycloakAuth({
      serverUrl: authBaseURL,
      clientId,
      clientSecret,
      margin: 12,
    });
    const api = axios.create({ baseURL: serviceBaseURL });
    const authInterceptor = keycloakAxios(authObject);

    api.interceptors.request.use(authInterceptor);

    await api.get('/test');
    await api.get('/test');
  });

  it('Should take a config object with apiKey turn it into a usable axios interceptor', async () => {
    nock.cleanAll();
    handleOptionsPreflight(1);

    nock(serviceBaseURL)
      .matchHeader('Authorization', 'Bearer access-1')
      .get('/test')
      .reply(200, { ok: true });

    nock(authBaseURL, { reqheaders: { 'X-API-Key': 'test-api-key' } })
      .post('', `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`)
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

    const api = axios.create({ baseURL: serviceBaseURL });
    const authInterceptor = keycloakAxios({
      serverUrl: authBaseURL,
      clientId,
      clientSecret,
      apiKey: 'test-api-key',
      margin: 12,
    });

    api.interceptors.request.use(authInterceptor);

    await api.get('/test');
  });
});
