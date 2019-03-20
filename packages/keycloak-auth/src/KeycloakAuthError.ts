export class KeycloakAuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}
