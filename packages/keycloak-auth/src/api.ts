import fetch, { Request, RequestInit } from 'node-fetch';
import { URLSearchParams } from 'url';
import { KeycloakAuthError } from './KeycloakAuthError';

export interface KeycloakResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpires: number;
  refreshTokenExpires: number;
  refreshToken: string;
}

const jsonFetch = async <T>(req: string | Request, init: RequestInit = {}): Promise<T> => {
  const res = await fetch(req, init);
  const data = await res.json();
  if (!res.ok) {
    throw new KeycloakAuthError(data.error_description, data.error);
  } else {
    return data;
  }
};

interface KeycloakRequest {
  serverUrl: string;
  clientId: string;
  clientSecret: string;
}

interface RefreshTokenKeycloakRequest extends KeycloakRequest {
  refreshToken: string;
}

interface AuthRequest extends KeycloakRequest {
  previous?: AuthResponse;
  clockTimestamp?: number;
  margin?: number;
}

export const login = ({ serverUrl, clientId, clientSecret }: KeycloakRequest) =>
  jsonFetch<KeycloakResponse>(`${serverUrl}/auth/realms/ovo-energy/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

export const refresh = ({ serverUrl, clientId, clientSecret, refreshToken }: RefreshTokenKeycloakRequest) =>
  jsonFetch<KeycloakResponse>(`${serverUrl}/auth/realms/ovo-energy/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

const nowSeconds = () => new Date().getTime() / 1000;

export const toAuth = (
  { access_token, refresh_token, refresh_expires_in, expires_in }: KeycloakResponse,
  clockTimestamp: number,
): AuthResponse => ({
  accessToken: access_token,
  accessTokenExpires: clockTimestamp + expires_in,
  refreshToken: refresh_token,
  refreshTokenExpires: clockTimestamp + refresh_expires_in,
});

export const isExpired = (expires: number, clockTimestamp: number, margin: number) =>
  clockTimestamp + margin >= expires;

export const authenticate = async ({
  serverUrl,
  clientId,
  clientSecret,
  previous,
  clockTimestamp,
  margin = 10,
}: AuthRequest) => {
  const timestamp = clockTimestamp || nowSeconds();
  if (previous) {
    const { accessTokenExpires, refreshTokenExpires, refreshToken } = previous;
    if (!isExpired(accessTokenExpires, timestamp, margin)) {
      return previous;
    } else if (!isExpired(refreshTokenExpires, timestamp, margin)) {
      try {
        const refreshResponse = await refresh({ serverUrl, clientId, clientSecret, refreshToken });
        return toAuth(refreshResponse, timestamp);
      } catch (error) {
        if (error instanceof KeycloakAuthError) {
          return toAuth(await login({ serverUrl, clientId, clientSecret }), timestamp);
        } else {
          throw error;
        }
      }
    }
  }
  const loginResponse = await login({ serverUrl, clientId, clientSecret });
  return toAuth(loginResponse, timestamp);
};
