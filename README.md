# BIT Kafka Tools

[![CircleCI](https://circleci.com/gh/ovotech/bit-node-tools.svg?style=svg&circle-token=ae40b0f9ff7943343688a0319478e70091e37fbe)](https://circleci.com/gh/ovotech/bit-node-tools)

BIT Team tools for working with Kafka, Avro and other misc stuff. They are split into several independent packages that can be imported separately.

## Working with node-kafka, avro and our confluence schema registry

| Package                                                                | Status       | Description                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [@ovotech/kafka-avro-cli](packages/kafka-avro-cli/README.md)           | Used in prod | A CLI for inspecting the [confluent schema-registry](https://docs.confluent.io/current/schema-registry/docs/index.html), produce and consume avro kafka events.                                                                                                      |
| [@ovotech/avro-stream](packages/avro-stream/README.md)                 | Used in prod | Serialize/deserialize [kafka-node](https://github.com/SOHU-Co/kafka-node) streams with [avro](https://avro.apache.org/docs/current/) data, using [confluent schema-registry](https://docs.confluent.io/current/schema-registry/docs/index.html) to hold the schemas. |
| [@ovotech/kafka-pg-sink](packages/kafka-pg-sink/README.md)             | Used in prod | Store [kafka-node](https://github.com/SOHU-Co/kafka-node) events into a postgres database.                                                                                                                                                                           |
| [@ovotech/schema-registry-api](packages/schema-registry-api/README.md) | Used in prod | A simple typescript [node-fetch](https://github.com/bitinn/node-fetch) wrapper on the [confluent schema-registry](https://docs.confluent.io/current/schema-registry/docs/index.html) api.                                                                            |
| [@ovotech/re-pipeline](packages/re-pipeline/README.md)                 | Used in prod | A node streams pipeline implementation, that reconnects the pipes on error, once the error has been handled.                                                                                                                                                         |
| [@ovotech/kafka-consumer](packages/kafka-consumer/README.md)           | Used in prod | A generic kafka consumer                                                                                                                                                                                                                                             |

## Misc repos

| Package                                                                        | Status       | Description                                                                                                                                                               |
| ------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [@ovotech/winston-logger](packages/winston-logger/README.md)                   | Used in prod | Wrap winston logger to hide graylog semantics and implement safe static meta contexts with PII sanitisers                                                                 |
| [@ovotech/apollo-datasource-axios](packages/apollo-datasource-axios/README.md) | Used in prod | A rest datasource that uses axios under the hood. This allows adding generic interceptors, adapters etc. Integrates with cache and cache policies. Supports Interceptors. |
| [@ovotech/bigquery-pg-sink](packages/bigquery-pg-sink/README.md)               | Used in prod | Stream the results of query made by [nodejs-bigquery](https://github.com/googleapis/nodejs-bigquery) into a [postgres database](https://www.postgresql.org/).             |
| [@ovotech/influx-metrics-tracker](packages/influx-metrics-tracker/README.md)   | Used in prod | Track metrics and store them in an Influx database, with secondary [logging](packages/winston-logger/README.md) if Influx is unavailable.                                 |

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

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests.

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
