# Axios Logger Interceptor

Log request and response, redact all possible PII sources by default, but allow to add custom redact paths so more info can be logged.

### Using

```bash
yarn add @ovotech/axios-logger
```

```typescript
import { axiosLogger } from '@ovotech/axios-logger';
import axios from 'axios';

const logger = axiosLogger((level, meta, config) => console.log(level, meta, config.url));

const api = axios.create();
api.interceptors.request.use(logger.request.onFullfilled);
api.interceptors.response.use(logger.response.onFullfilled, logger.response.onRejected);

// ...

api.get('/my/path');

const body = { user: { cards: [{ id: '111' }, { id: '222' }] } };
api.post('/update/path', body, { redact: ['requestBody.user.cards.*.id'] });
```

You have 3 interceptors. `logger.request.onFullfilled`, `logger.response.onFullfilled` and `logger.response.onRejected`.

- `logger.request.onFullfilled` used to setup the initial execution time. If omitted request time would not be logged.
- `logger.response.onFullfilled` logs a successful response
- `logger.response.onRejected` logs an error

Each one can be omitted if you don't want or need that feature.

The log function will receive 3 arguments - level, meta and axios request config. The first one indicates what type of log level to use - "info" for success and "error" for error. The second contains an object of data to log.

```js
{
  uri: '/my/path',
  method: 'get',
  params: { id: '10' }
  requestBody: { id: '10' },
  responseBody: { user: 'Name' },
  status: 200,
  responseTime: 21,
}
```

By default `uri`, `params`, `requestBody` and `responseBody` will be "redacted", since they can contain personally identifiable information. You can control that with the `redact` property. Its a list of dot delimited field paths to be redacted. Can contain wildcard `*` path to target all array items.

For example to redact some fields.

```typescript
api.post('/update/path', body, { redact: ['requestBody.id', 'responseBody.user'] });
```

You can also set redact at the axios instance level for global redaction rules:

```typescript
const api = axios.create({ redact: ['requestBody'] });
```

### TypeScript

Since axios types strictly define available properties for axios configs, if you want to use `redact` you'll need to take advantage of the `WithLogger` type:

```typescript
const api = axios.create({ redact: ['requestBody'] } as WithLogger);
```

### Granular logging

You can perform different things on error / success by inspecting the "level" argument, passed to the log function.

```typescript
import { axiosLogger, WithLogger } from '@ovotech/axios-logger';
import axios from 'axios';

const logger = axiosLogger((level, meta) => {
  if (level === 'info') {
    myOwnLogger.info('Successful request', meta);
    graphResponseTimes(meta.responseTime);
  }
  if (level === 'error') {
    myOwnLogger.error('Error request', meta);
  }
});
```

## Running the tests

You can run the tests with:

```bash
yarn test
```

### Coding style (linting, etc) tests

Style is maintained with prettier and tslint

```
yarn lint
```

## Deployment

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
