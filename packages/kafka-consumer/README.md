# Kafka Consumer

A generic kafka consumer.

### Using

```bash
yarn add @ovotech/kafka-consumer
```

```typescript
const onDetectNotification = async (message: AvroMessage) => {
  //handle notification
};

createKafkaConsumer(
  {
    OPTIONS: {},
    KAFKA_SCHEMA_REGISTRY: env.KAFKA_SCHEMA_REGISTRY!,
    KAFKA_TOPICS: ['topic_v1', 'topic_v2'],
  },
  logger,
  onDetectNotification,
);
```

## Running the tests

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

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
