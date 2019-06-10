# Influx Metrics Tracker

Track metrics and store them in an Influx database, with secondary logging if Influx is unavailable or invalid input is provided.

## Using

```bash
yarn add @ovotech/influx-metrics-tracker
```

```typescript
import { MetricsTracker } from '@ovotech/influx-metrics-tracker';
import { Logger } from '@ovotech/winston-logger';
import { InfluxDB, ISingleHostConfig } from 'influx';
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

// Create Logger and Influx instances
const winstonLogger = winston.createLogger(...);
const logger = new Logger(winstonLogger, { traceToken: req.headers['X-Trace-Token'] });
const config: ISingleHostConfig = {
  host: 'my-influx-host',
};
const influx = new InfluxDB(influxConfig);

// Create the tracker
const metricsMeta = {
  env: process.env.NODE_ENV,
};
const tracker = new PerformanceMetricsTracker(influx, logger, metricsMeta);

// Track a point
await tracker.trackQueryTime(12.34, 'myFirstQuery')
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
