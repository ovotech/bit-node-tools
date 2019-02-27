# Winston logger

Wrap winston logger to hide graylog semantics and implement safe static meta contexts.

### Using

```bash
yarn add @ovotech/winston-wrapper
```

```typescript
import { Logger } from '@ovotech/winston-wrapper';
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

To deploy a new version, push to master and then create a new release. CircleCI will automatically build and deploy a the version to the npm registry.
All package versions are synchronized, but it will only publish the versions of the packages that have changed.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test/index.spec.ts](test/index.spec.ts)).

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
