# Postgres migration tool with plain sql

A cli tool to simplify using [@ovotech/pg-sql-migrate](../pg-sql-migrate).

## Using with CLI

```bash
yarn add @ovotech/pg-sql-migrate-sql
yarn pg-migrate create my_migration
```

add a configuration file, which by default is `./pg-sql-migrate.config.json` to configure the connection:

```json
{
  "client": "postgresql://postgres:dev-pass@0.0.0.0:5432/postgres"
}
```

This will create a file `migrations/<timestamp>_my_migration.pgsql` that you can place raw sql into. After that, you can run the migration(s) by calling

```bash
yarn pg-migrate execute
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

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
