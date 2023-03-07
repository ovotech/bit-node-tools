# Datadog Metrics Tracker

Track metrics and store them in Datadog, with secondary logging if Datadog is unavailable or invalid input is provided.

## Using

```bash
yarn add @ovotech/datadog-metrics-tracker
```

```typescript
import { createDataDogConnection, MetricsTracker } from '@ovotech/datadog-metrics-tracker';
import { Logger } from '@ovotech/winston-logger';
import * as winston from 'winston';

// Define a specific tracker
class PerformanceMetricsTracker extends MetricsTracker {
  private static queryTimeMeasurementName = 'query-time';

  async trackQueryTime(timeMs: number, queryName: string) {
    await this.trackPoint(
      PerformanceMetricsTracker.queryTimeMeasurementName,
      { queryName },
      { timeMs: Math.round(timeMs) },
    );
  }
}

// Create Logger and Datadog instances
const winstonLogger = winston.createLogger(...);
const logger = new Logger(winstonLogger, { traceToken: req.headers['X-Trace-Token'] });
const datadog = createDataDogConnection(process.env);

// Create the tracker
const metricsMeta = {
  extraTagName: 'some-value',
};
const tracker = new PerformanceMetricsTracker(datadog, logger, metricsMeta);

// Track a point
await tracker.trackQueryTime(12.34, 'myFirstQuery')
```

As well as a base class that allows you to define custom trackers, there are pre-defined trackers for common operations.
These allow services to use a common interface and not re-implement the same functionality.

- `ExternalRequestMetricsTracker` - track information about calling other services
- `KafkaMetricsTracker` - track actions around the lifecycle of Kafka events
- `ResponseMetricsTracker` - track information about responses from an API

## Beware

Don't add too many unique / varying possibilities, e.g. monetary amounts, to the `tags` - they will set off DataDog Monitor alerts within the business, because too many "custom metrics" escalate DataDog costs.
Multi-variant values, e.g. monetary amounts, should be in the `value(s)`.

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
