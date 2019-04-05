# Winston logger

Wrap winston logger to hide graylog semantics and implement safe static meta contexts.

### Using

```bash
yarn add @ovotech/winston-logger
```

```typescript
import { Logger } from '@ovotech/winston-logger';
import * as winston from 'winston';

const winstonLogger = winston.createLogger(...);

const myRequestProcessor = (req: Request) =>{
  const logger = new Logger(winstonLogger, { traceToken: req.headers['X-Trace-Token'] });

  logger.info('test');
}
```

All the normal winston logger methods are implemented, alongside their "log('level', ...)" counterparts.

```typescript
logger.silly('test-message', { other: 'stuff' });
logger.log('silly', 'test-message', { other: 'stuff' });

logger.notice('test-message', { other: 'stuff' });
logger.log('notice', 'test-message', { other: 'stuff' });

logger.info('test-message', { other: 'stuff' });
logger.log('info', 'test-message', { other: 'stuff' });

logger.warn('test-message', { other: 'stuff' });
logger.log('warn', 'test-message', { other: 'stuff' });

logger.error('test-message', { other: 'stuff' });
logger.log('error', 'test-message', { other: 'stuff' });
```

## Adding static meta

You can add more static meta after the class has been instantiated. This however results in a new Logger with the additional (merged) static meta, and the old object is unaffected.

```typescript
import { Logger } from '@ovotech/winston-logger';
import * as winston from 'winston';

const winstonLogger = winston.createLogger(...);

const logger = new Logger(winstonLogger, { uri: '/some-url' });
const extendedLogger = logger.withStaticMeta({ additional: 'test' });
```

## Sanitizers

You can add functions that modify the metadata just before the log is sent. This is use to redact sensitive info from the log.

```typescript
import { Logger, LoggerSanitizer } from '@ovotech/winston-logger';
import * as winston from 'winston';

const winstonLogger = winston.createLogger(...);

const sanitize: LoggerSanitizer = (meta) => {
  const { email, ...rest } = meta;
  return rest;
}

const logger = new Logger(winstonLogger, {}, [sanitize]);
logger.info("User logged in", { email: 'user@example.com' });
```

You can add additional sanitizers later on with the `withSanitizers` method, it will not modify the logger instance, but create a new one, with the additional sanitizers.

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

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
