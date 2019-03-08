# BIT Kafka Tools

[![CircleCI](https://circleci.com/gh/ovotech/bit-node-tools.svg?style=svg&circle-token=ae40b0f9ff7943343688a0319478e70091e37fbe)](https://circleci.com/gh/ovotech/bit-node-tools)

BIT Team tools for working with Kafka, Avro and other misc stuff. They are split into several independent packages that can be imported a la carte.

## Kafka Avro CLI

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

const consumerStream = new ConsumerGroupStream(
  { kafkaHost: 'karka.example.com:29092', groupId: 'my-group', encoding: 'buffer' },
  ['migration-completed'],
);
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
  { kafkaHost: 'karka.example.com:29092', groupId: 'my-group', encoding: 'buffer' },
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
        return [data.column1, data.column2, data];
      },
    },
  },
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

## Postgres sql migrate

A very small library for running sql migrations with postgres. It differs from the numerous other libs in this domain by being very minimal, using only raw timestamped sql files. No "down" migrations are provided by design, as that is usually a bad idea in production anyway.

It is split into [@ovotech/pg-sql-migrate](packages/pg-sql-migrate) which is a library that handles the migration, and [@ovotech/pg-sql-migrate-cli](packages/pg-sql-migrate-cli) which allows creating and running migrations from the command line.

This makes it possible to import this library to your project to run migrations on server start without the dependency of `yargs` and all the other packages that handle cli. Zero external dependencies.

Example library:

```typescript
import { migrate } from '@ovotech/pg-sql-migrate';

const results = await migrate();
```

Example cli:

```bash
yarn pg-migrate create my_migration
yarn pg-migrate execute
```

More documentation inside the packages:
[@ovotech/pg-sql-migrate](packages/pg-sql-migrate/README.md)
[@ovotech/pg-sql-migrate-cli](packages/pg-sql-migrate-cli/README.md)

## Avro TS CLI

Generate typescript from avro schemas.

```bash
yarn add @ovotech/avro-ts-cli
yarn avro-ts convert avro/*.avsc --output-dir __generated__/
```

If no output dir is provided, the avsc files will be generated alongside the source files

```bash
yarn avro-ts convert avro/*.avsc
```

Logical types are also supported:

```bash
yarn avro-ts convert avro/*.avsc --logical-type date=string --logical-type timestamp-millis=string
```

Using it as a library:

Example usage:

```typescript
import { avroTs } from '@ovotech/avro-ts';

const avro: RecordType = JSON.parse(String(readFileSync('avroSchema.avsc')));
const ts = avroTs(avro, { 'timestamp-millis': 'string', date: 'string' });

console.log(ts);
```

More documentation inside the packages:
[@ovotech/avro-ts](packages/avro-ts/README.md)
[@ovotech/avro-ts-cli](packages/avro-ts-cli/README.md)

## Winston Logger

Wrap winston logger to hide graylog semantics and implement safe static meta contexts.

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

More documentation inside the packages:
[@ovotech/winston-logger](packages/winston-logger/README.md)

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

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
