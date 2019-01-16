# Avro Logical Types

Some logical types for [avsc](https://github.com/mtth/avsc).

### Using

```bash
yarn add @ovotech/avro-logical-types
```

```typescript
import { DateType } from '@ovotech/avro-logical-types';
import { Type } from 'avsc';

const type = Type.forSchema(
  {
    type: 'record',
    fields: [{ name: 'kind', type: { type: 'enum', symbols: ['CAT', 'DOG'] } }, { name: 'name', type: 'string' }],
  },
  { logicalTypes: { date: DateType } },
);
```

Or with [@ovotech/avro-stream](https://github.com/ovotech/bit-kafka-tools/tree/master/packages/avro-stream)

```typescript
import { AvroDeserializer } from '@ovotech/avro-stream';
import { DateType, TimestampType } from '@ovotech/avro-logical-types';

const deserializer = new AvroDeserializer('http://localhost:8081', {
  logicalTypes: { date: DateType, 'timestamp-millis': TimestampType },
});
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
