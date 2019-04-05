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

Or with [@ovotech/avro-stream](https://github.com/ovotech/bit-node-tools/tree/master/packages/avro-stream)

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

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
