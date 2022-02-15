# Kafka DataDog

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Middleware that instruments a Kafka consumer with datadog APM (Application Performance Monitoring) and metrics.

## Installation

```bash
yarn add @ovotech/kafka-datadog
```

## Usage

```typescript
import { datadog, DependenciesContext } from '@ovotech/kafka-datadog';
import { Middleware } from '@ovotech/castle';

interface Dependencies {
  someDependency: string;
}

const dependencies: Dependencies = {
  someDependency: 'mock-dependency',
};

const createDependencyMiddleware = function<T>(dependencies: T): Middleware<DependenciesContext<T>> {
  return function(next) {
    return async function(ctx): Promise<void> {
      await next({ ...ctx, dependencies });
    };
  };
};

const dependencyMiddleware = createDependencyMiddleware(dependencies);

const middleware = (handler: Resolver<any>) => dependencyMiddleware(datadog(handler));
```

### Coding style (linting, etc) tests

Code style is enforced by using a linter ([tslint](https://palantir.github.io/tslint/)) and [Prettier](https://prettier.io/).

```bash
yarn lint
```

## Deployment

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
