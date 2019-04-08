# AxiosDataSource for Apollo

A rest datasource that uses axios under the hood. This allows adding generic interceptors, adaptors etc.
Integrates with cache and cache policies.

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

const dataSource = new MyDataSource({ baseURL: ..., });
```

### Interceptors

You can pass interceptors to axios declartivly with the `request: []` or `response: []` option keys, for request or response interceptors respectively.

```typescript
const logResponse = (res) => {
  console.log(res);
  return res;
}

const logErr = (err) => {
  console.log(err);
  return err;
}

const dataSource = new MyDataSource(
  { baseURL: ..., },
  { response: [{ onFulfilled: logResponse, onRejected: logErr }]}
);
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
