import { AxiosRequestConfig } from 'axios';
import { authenticate, AuthResponse } from './api';
import { KeycloakAuth } from './KeycloakAuth';

export interface KeycloakAxiosOptions {
  serverUrl: string;
  clientId: string;
  clientSecret: string;
  margin?: number;
}

export const keycloakAxios = (input: KeycloakAxiosOptions | KeycloakAuth) => {
  if (input instanceof KeycloakAuth) {
    return async (config: AxiosRequestConfig) => {
      const authResponse = await input.authenticate();
      config.headers!.Authorization = `Bearer ${authResponse.accessToken}`;
      return config;
    };
  }

  let previous: AuthResponse;
  return async (config: AxiosRequestConfig) => {
    previous = await authenticate({ ...input, previous });
    config.headers!.Authorization = `Bearer ${previous.accessToken}`;
    return config;
  };
};
