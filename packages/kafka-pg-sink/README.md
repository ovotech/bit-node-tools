# PG Stream

Store [kafka-node](https://github.com/SOHU-Co/kafka-node) events into a postgres database.

### Using

```bash
yarn add @ovotech/kafka-pg-sink
```

Each topic from the consumer stream gets its own "resolver" function that converts the message to an array of values, directly inserted as columns in the database.

```sql
INSERT INTO tableName VALUES (column1Value, column2Value ...) ON CONFLICT DO NOTHING
```

```typescript
import { PGSinkStream } from '@ovotech/kafka-pg-sink';
import { ConsumerGroupStream, Message } from 'kafka-node';

const consumerStream = new ConsumerGroupStream(
  { kafkaHost: 'localhost:29092', groupId: 'my-group' },
  ['migration-completed'],
);

const pg = new Client('postgresql://postgres:dev-pass@0.0.0.0:5432/postgres');
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

## Usage with a deserializer

You can transform kafka events with a transform stream before they arrive to the sink. For example with `@ovotech/avro-stream`.

```typescript
import { AvroDeserializer, AvroMessage } from '@ovotech/avro-stream';
import { PGSinkStream } from '@ovotech/kafka-pg-sink';
import { ConsumerGroupStream } from 'kafka-node';

const consumerStream = new ConsumerGroupStream(
  { kafkaHost: 'localhost:29092', groupId: 'my-group' },
  ['migration-completed'],
);
const deserializer = new AvroDeserializer('http://localhost:8080');
const pg = new Client('postgresql://postgres:dev-pass@0.0.0.0:5432/postgres');
const pgSink = new PGSinkStream({
  pg,
  topics: {
    'migration-completed': {
      table: 'migration_completed',
      resolver: (message: AvroMessage) => [message.value.accountId]',
    }
  }
});

consumerStream.pipe(deserializer).pipe(pgSink);
```

## Gotchas

A thing to be aware of is that node streams unpipe in an event of an error, which means that you'll need to provide your own error handling and repipe the streams if you want it to be resilient to errors.

## Running the tests

The tests require a running postgres database. This is setup easily with a docker-compose from root project folder:

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
