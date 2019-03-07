# Config File

Read a config file, and insert ENV vars where needed.

### Using

```bash
yarn add @ovotech/config-file
```

`test.config.json`

```json
{
  "db": "db://user:${DB_PASSWORD}/db-name"
}
```

```typescript
import { loadConfigFile } from '@ovotech/config-file';

interface Config {
  db?: string;
}

const config = loadConfigFile<Config>({ env: process.env, file: 'test.config.json', required: ['db'] });
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

To deploy a new version, push to master and then create a new release. CircleCI will automatically build and deploy a the version to the npm registry.
All package versions are synchronized, but it will only publish the versions of the packages that have changed.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see `test/integration.spec.ts`).

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
