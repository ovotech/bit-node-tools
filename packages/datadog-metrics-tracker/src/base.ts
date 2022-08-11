import { Logger } from '@ovotech/winston-logger';
import BatchCalls from './helpers/batch-calls';
import { executeCallbackOrExponentiallyBackOff } from './helpers/exponential-backoff';

var StatsD = require("hot-shots");
var dogstatsd = new StatsD();
const ONE_MINUTE = 60000;

interface Point {
  measurement: string;
  tags: { [name: string]: string };
  fields: { [name: string]: any };
}

export abstract class MetricsTracker {
  constructor(
    protected dogstatsd: () => {},
    protected logger: Logger,
    protected staticMeta?: {
      [key: string]: any;
    },
    protected batchCalls?: BatchCalls,
    protected batchSendIntervalMs = ONE_MINUTE,
  ) {
    this.sendPointsToDatadog = this.sendPointsToDatadog.bind(this);
    this.batchCalls = batchCalls || new BatchCalls(this.sendPointsToDatadog);
  }

  protected async trackPoint(
    measurementName: string,
    tags: { [name: string]: string },
    fields: { [name: string]: any },
  ) {
    const validTags = this.getValidTags(tags);
    this.logInvalidTags(measurementName, tags);

    try {
      this.logger.info(`Tracking point for ${measurementName}`);
      this.batchCalls!.addToBatch({
        measurement: measurementName,
        tags: {
          ...this.staticMeta,
          ...validTags,
        },
        fields,
      });
      return;
    } catch (err) {
      this.logger.error('Error tracking Datadog metric', {
        metric: measurementName,
        tags: JSON.stringify(validTags),
        fields: JSON.stringify(fields),
        error: err,
      });
      return;
    }
  }

  private async sendPointsToDatadog(points: Point[]) {
    this.logger.info(`Sending ${points.length} points to Datadog`);
    executeCallbackOrExponentiallyBackOff(() => dogstatsd.increment('retail-payg-balance-rest-service', points), this.logger);
  }

  private getInvalidTagNames(tags: { [name: string]: string }) {
    return Object.entries(tags)
      .filter(([_, value]) => value.length === 0)
      .reduce((names: string[], [key, _]) => names.concat([key]), []);
  }

  private getValidTags(tags: { [name: string]: string }) {
    return Object.entries(tags)
      .filter(([_, value]) => value.length > 0)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  }

  private logInvalidTags(measurementName: string, tags: { [name: string]: string }) {
    const invalidTagNames = this.getInvalidTagNames(tags);

    if (invalidTagNames.length) {
      this.logger.warn('Attempted to track tags with no value', {
        metric: measurementName,
        tagNames: invalidTagNames.sort().join(', '),
      });
    }
  }
}
