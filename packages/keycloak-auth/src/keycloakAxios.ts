import { AxiosRequestConfig } from 'axios';
import { authenticate, AuthResponse } from './api';

export interface KeycloakAxiosOptions {
  serverUrl: string;
  clientId: string;
  clientSecret: string;
  margin?: number;
}

export const keycloakAxios = (options: KeycloakAxiosOptions) => {
  let previous: AuthResponse;

  return async (config: AxiosRequestConfig) => {
    previous = await authenticate({ ...options, previous });
    config.headers.Authorization = `Bearer ${previous.accessToken}`;
    return config;
  };
};
