# BIT Kafka Tools

BIT Team tools for working with Kafka and Avro

## Using

This project is a con

## Running the tests

The tests require a running schema registry service, and we're using docker compose to start it, alongside kafka, zookeeper and postgres.

So in the project's root directory run:

```bash
docker-compose up
```

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

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see `test/integration.spec.ts`).

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
