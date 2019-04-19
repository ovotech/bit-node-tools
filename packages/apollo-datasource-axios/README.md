# AxiosDataSource for Apollo

A rest datasource that uses axios under the hood. This allows adding generic interceptors, adapters etc.
Integrates with cache and cache policies. Supports Interceptors.

### Using

```bash
yarn add @ovotech/apollo-datasource-axios
```

```typescript
import { AxiosDataSource } from '@ovotech/apollo-datasource-axios';

interface User {
  name: string;
}

export class MyDataSource extends AxiosDataSource {
  users(id: string) {
    return this.get<User>(`/users/${id}`);
  }
}

const dataSource = new MyDataSource({ baseURL: '...' });
```

### Interceptors

You can pass interceptors to axios declaratively with the `interceptros` property.

```typescript
import { Interceptor } from '@ovotech/apollo-datasource-axios';
const logger: Interceptor = {
  response: {
    onFulfilled: res => {
      console.log(res);
      return res;
    },
    onRejected: err => {
      console.log(err);
      return err;
    },
  },
};

const dataSource = new MyDataSource({ baseURL: '...', interceptors: [logger] });
```

### Advanced types

If you want to be more exact on the types passed to and from axios, you can fill in the optional types. This is useful if some of your interceptors are adding properties to the config.

```typescript
import { AxiosDataSource, AxiosDataSourceConfig } from '@ovotech/apollo-datasource-axios';

interface Context extends AxiosDataSourceConfig {
  version: string;
}

export class MyDataSource extends AxiosDataSource<Context> {
  users(id: string) {
    return this.get(`/users/${id}`, { version: '123' });
  }
}
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
