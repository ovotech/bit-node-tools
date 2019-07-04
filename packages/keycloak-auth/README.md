# Keycloak Auth

Retrieve access tokens for [keycloak oauth](https://www.keycloak.org/). Respect access token and refresh token expiry.

## Usage

```typescript
import { authenticate } from '@ovotech/keycloak-auth';

const tokens1 = await authenticate({
  serverUrl: 'http://keycloak-server.example.com',
  clientId: '...',
  clientSecret: '...',
});

// { accessToken: '...', refreshToken: '...', accessTokenExpires: 1553010721, refreshTokenExpires: 1553068047 }
console.log(tokens1);

// ... some time passes

const tokens2 = await authenticate({
  serverUrl: 'http://keycloak-server.example.com',
  clientId: '...',
  clientSecret: '...',
  previous: auth,
});
```

After the initial call, doing another `authenticate` with a `previous` argument would either - return the same response, if the authToken is still valid, use the refreshToken to generate a new authToken, if it has expired, or if refreshToken has expired as well, generate a new auth + refresh token.

By default it would give you a leeway of 10 seconds for the expiry checks, so auth and referesh tokens are expired 10 seconds earlier. You can configure this with the `margin` argument

```typescript
const auth1 = await authenticate({
  serverUrl: 'http://keycloak-server.example.com',
  clientId: '...',
  clientSecret: '...',
  // consider tokens expired 15 seconds earlier
  margin: 15,
});
```

## Usage with a class

If you want to encapsulate the state of the tokens inside of a class, you can use the `KeycloakAuth` class:

```typescript
import { KeycloakAuth } from '@ovotech/keycloak-auth';

const auth = new KeycloakAuth({
  serverUrl: 'http://keycloak-server.example.com',
  clientId: '...',
  clientSecret: '...',
});

const tokens1 = await auth.authenticate();

// ... sometime passes

const tokens2 = await auth.authenticate();
```

## Usage with axios

You can use the axios interceptor to add a bearer auth token to the requests automatically.

```typescript
import axios from 'axios';
import { keycloakAxios } from '@ovotech/keycloak-auth';

const api = axios.create({ baseURL: 'http://service.example.com' });
const auth = keycloakAxios({
  serverUrl: 'http://keycloak-server.example.com',
  clientId: '...',
  clientSecret: '...',
});

api.interceptors.request.use(auth);

// Would be called with Authorization: Bearer <authToken>
const response = await api.get('/test');
```

## Error handling

If there is an api error, you'll get an `KeycloackAuthError`

```typescript
import { authenticate, KeycloackAuthError } from '@ovotech/keycloak-auth';

try {
  const tokens1 = await authenticate({
    serverUrl: 'http://keycloak-server.example.com',
    clientId: '...',
    clientSecret: '...',
  });
} catch (error) {
  if (error instanceof KeycloackAuthError) {
    console.log(error.message, error.code);
  }
}
```

## Low level usage

You can also call the `login` and `refresh` functions directly, to get the raw server responses.

```typescript
import { login, refresh } from '@ovotech/keycloak-auth';

const tokens1 = await login({
  serverUrl: 'http://keycloak-server.example.com',
  clientId: '...',
  clientSecret: '...',
});

const tokens2 = await refresh({
  serverUrl: 'http://keycloak-server.example.com',
  clientId: '...',
  clientSecret: '...',
  refreshToken: tokens1.refresh_token,
});
```

## Decoding a request
You can also call the `bounce` function to decode a given access token, this can be used to protect a server

```typescript
const token = await authenticate({
  serverUrl: 'http://keycloak-server.example.com',
  clientId: '...',
  clientSecret: '...',
});

const res = await bounce(
  token.accessToken,
  {
    issuer: '...',
    jwksUri: '...',
  },
);
```

## Running the tests

Then you can run the tests with:

```bash
yarn test
```

### Coding style (linting, etc) tests

Style is maintained with prettier and tslint

```
yarn lint
```

## Deployment

Deployment is performed by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
