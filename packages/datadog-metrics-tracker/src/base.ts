import { Logger } from '@ovotech/winston-logger';
import { StatsD } from 'hot-shots';

interface Point {
  tags: { [name: string]: string };
  fields: { [name: string]: any };
  measurement: string;
  value?: number;
}

export abstract class MetricsTracker {
  constructor(
    protected dogstatsd: StatsD,
    protected logger: Logger,
    protected staticMeta?: {
      [key: string]: any;
    },
  ) {
    this.sendPointsToDatadog = this.sendPointsToDatadog.bind(this);
  }

  protected async trackPoint(
    measurementName: string,
    tags: { [name: string]: string },
    fields: { [name: string]: any },
    value?: number,
  ) {
    const validTags = this.getValidTags(tags);
    this.logInvalidTags(measurementName, tags);

    try {
      this.logger.info(`Tracking point for ${measurementName}`);
      this.sendPointsToDatadog({
        measurement: measurementName,
        tags: {
          ...this.staticMeta,
          ...validTags,
        },
        fields,
        value,
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

  private async sendPointsToDatadog(point: Point) {
    this.logger.info(`Sending metrics to Datadog`);
    const { measurement, tags, fields, value } = point;
    //datadog metrics tag
    this.dogstatsd.distribution(measurement, value || 1, { ...tags, ...fields });
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
