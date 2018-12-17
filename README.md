# BIT Kafka Tools

[![CircleCI](https://circleci.com/gh/ovotech/bit-kafka-tools.svg?style=svg&circle-token=ae40b0f9ff7943343688a0319478e70091e37fbe)](https://circleci.com/gh/ovotech/bit-kafka-tools)

BIT Team tools for working with Kafka and Avro

## Using

This is split into several independent packages that can be imported as needed

## CLI

A CLI for inspecting the [confluent schema-registry](https://docs.confluent.io/current/schema-registry/docs/index.html), produce and consume avro kafka events.
![packages/kafka-avro-cli/README.md](assets/kac.gif)

More documentation inside the package:
[@ovotech/kafka-avro-cli](packages/kafka-avro-cli/README.md)

## Avro Stream

Serialize/deserialize [kafka-node](https://github.com/SOHU-Co/kafka-node) streams with [avro](https://avro.apache.org/docs/current/) data, using [confluent schema-registry](https://docs.confluent.io/current/schema-registry/docs/index.html) to hold the schemas.

Example:

```typescript
import { AvroDeserializer } from '@ovotech/avro-stream';
import { WritableMock } from 'stream-mock';
import { ConsumerGroupStream } from 'kafka-node';

const consumerStream = new ConsumerGroupStream({ kafkaHost: 'karka.example.com:29092', encoding: 'buffer' }, [
  'migration-completed',
]);
const deserializer = new AvroDeserializer('https://schema-registry.example.com:8081');
const sinkStream = new WritableMock({ objectMode: true });

consumerStream.pipe(deserializer).pipe(sinkStream);
```

More documentation inside the package:
[@ovotech/avro-stream](packages/avro-stream/README.md)

## Kafka Postgres Sink

Store [kafka-node](https://github.com/SOHU-Co/kafka-node) events into a postgres database.

Example:

```typescript
import { PGSinkStream } from '@ovotech/kafka-pg-sink';
import { ConsumerGroupStream, Message } from 'kafka-node';
import { Client } from 'pg';

const consumerStream = new ConsumerGroupStream(
  { kafkaHost: 'karka.example.com:29092', groupId: 'my-group' },
  ['migration-completed'],
);

const pg = new Client('postgresql://user:pass@pg.example.com:5432/my-db');
const pgSink = new PGSinkStream({
  pg,
  topics: {
    'migration-completed': {
      table: 'migration_completed',
      resolver: (message: Message) => {
        const data = getDataSomehow(message.value);
        return [data.column1, data.column2, data]
      }',
    }
  }
});

consumerStream.pipe(pgSink);
```

More documentation inside the package:
[@ovotech/kafka-pg-sink](packages/kafka-pg-sink/README.md)

## Schema registry

A simple typescript [node-fetch](https://github.com/bitinn/node-fetch) wrapper on the [confluent schema-registry](https://docs.confluent.io/current/schema-registry/docs/index.html) api.

Example:

```typescript
import { Schema } from 'avsc';
const schema: Schema = {
  type: 'record',
  name: 'TestSchema',
  fields: [{ name: 'accountId', type: 'string' }],
};
const baseUrl = 'https://schema-registry.example.com:8081';
const subjects = await getSubjects(baseUrl);
const newVersion = await addSubjectVersion(baseUrl, 'clients', schema);
const foundSchema = await getSchema(baseUrl, newVersion.id);
```

More documentation inside the package:
[@ovotech/schema-registry-api](packages/schema-registry-api/README.md)

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
