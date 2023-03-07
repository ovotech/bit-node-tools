import { Logger } from '@ovotech/winston-logger';
import { StatsD } from 'hot-shots';

interface Point {
  tags: { [name: string]: string };
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

  // todo:
  // make a function that calls trackPoint multiple times

  // here is a 'bad' example, it calls trackPoint

  // 'measurementName',
  // {
  //       cause,
  //       systemType,
  //       requestBy,
  //       direction: BalancesMetricsTracker.getDirection(amountInPennies),
  //       amountInPennies: Math.abs(amountInPennies).toString(), <-- uniques
  //       repaymentRateAmount: repaymentRateInPennies.toString(),
  //     },
  // 1

  // different metric name for each

  // e.g. balance_adjustment.direction
  // e.g. balance_adjustment.balanceInPennnies

  // N.B. HANDLE WHEN EMPTY

  // this is what we should do

  // 'measurementName',
  // {
  //       cause,
  //       systemType,
  //       requestBy,
  // direction: BalancesMetricsTracker.getDirection(100),
  //
  //     },
  //{

  //
  //       amountInPennies: Math.abs(200).toString(),
  //       repaymentRateAmount: repaymentRateInPennies.toString(),
  //     },

  protected async trackPoints(
    measurementName: string,
    tags: { [name: string]: string },
    values: { [name: string]: number },
  ) {
    // for each value in the values
    // --> this.trackPoint()
    //value => trackPoint(mName, tag, value.value)
    // direction is a tag
    // only one value per custom Metric
    // where mName is
    // e.g. `balance_adjustment.repaymentRateAmount`
    // e.g. `balance_adjustment.balanceInPennnies`

    for (let name in values) {
      console.log(name);
      let value = values[name];
      this.trackPoint(`${measurementName}.${name}`, tags, value);
    }
    // values.map((value)=> {

    // })

    // this.trackPoint('dave', {});
  }

  protected async trackPoint(measurementName: string, tags: { [name: string]: string }, value?: number) {
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
        value,
      });
      return;
    } catch (err) {
      this.logger.error('Error tracking Datadog metric', {
        metric: measurementName,
        tags: JSON.stringify(validTags),
        error: err,
      });
      return;
    }
  }

  private async sendPointsToDatadog(point: Point) {
    this.logger.info(`Sending metrics to Datadog`);
    const { measurement, tags, value } = point;
    //datadog metrics tag
    this.dogstatsd.distribution(measurement, value || 1, { ...tags });
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
