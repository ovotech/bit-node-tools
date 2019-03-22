import { authenticate, AuthResponse } from './api';

export interface KeycloakAuthOptions {
  serverUrl: string;
  clientId: string;
  clientSecret: string;
  margin?: number;
}

export class KeycloakAuth {
  private previous: AuthResponse | undefined;
  constructor(private options: KeycloakAuthOptions) {}

  async authenticate() {
    this.previous = await authenticate({ ...this.options, previous: this.previous });
    return this.previous;
  }
}
