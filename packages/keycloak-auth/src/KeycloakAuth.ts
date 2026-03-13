import { authenticate, AuthResponse } from './api';

export interface KeycloakAuthOptions {
  serverUrl: string;
  clientId: string;
  clientSecret: string;
  /** API key is optionally used to identify our services for purposes like rate limiting */
  apiKey?: string;
  margin?: number;
}

export class KeycloakAuth {
  private authPromise: Promise<AuthResponse> | undefined;
  private previous: AuthResponse | undefined;
  constructor(private options: KeycloakAuthOptions) {}

  async authenticate(): Promise<AuthResponse> {
    // Prevent thundering herd - I=if there's a request already in-flight, return the existing promise
    if (this.authPromise) return this.authPromise;

    this.authPromise = this.fetchAuth();

    return this.authPromise;
  }

  private async fetchAuth(): Promise<AuthResponse> {
    try {
      this.previous = await authenticate({ ...this.options, previous: this.previous });
      return this.previous;
    } finally {
      this.authPromise = undefined;
    }
  }
}
