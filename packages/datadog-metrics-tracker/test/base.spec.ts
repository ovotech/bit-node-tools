import { MetricsTracker } from '../src';

const testMeasurementName = 'test-metrics';

export class TestTracker extends MetricsTracker {
  private static testMeasurementName = testMeasurementName;

  async trackSomething(tags: { [name: string]: string }) {
    await this.trackPoint(TestTracker.testMeasurementName, tags);
  }

  async trackMultipleValues(metricName: string, tags: { [name: string]: string }, values: { [name: string]: number }) {
    await this.trackPoints(metricName, tags, values);
  }
}

jest.useFakeTimers();

describe('Base metrics class', () => {
  const metricsMeta = {
    extraTagName: 'some-value',
  };
  let mockDatadog: any;
  let mockLogger: any;
  let tracker: TestTracker;
  let trackerWithoutMetricsMeta: TestTracker;

  beforeEach(() => {
    mockDatadog = { distribution: jest.fn() };
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
    tracker = new TestTracker(mockDatadog, mockLogger, metricsMeta);
    trackerWithoutMetricsMeta = new TestTracker(mockDatadog, mockLogger);
  });

  it('Should track valid tags and write the points to Datadog in a batch call', async () => {
    const tags = { value: 'A string' };

    await tracker.trackSomething(tags);
    const data = {
      ...metricsMeta,
      ...tags,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith(testMeasurementName, 1, data);
  });

  it('Should track valid metrics and write the points to Datadog in a batch call', async () => {
    const metrics = { string: 'A string' };

    await tracker.trackSomething(metrics);
    const data = {
      ...metricsMeta,
      ...metrics,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith(testMeasurementName, 1, data);
  });

  it('Should log rather than track that have empty values', async () => {
    const validTags = { validTag: 'A string' };
    const invalidTags = { invalidTag: '', anotherInvalidTag: '' };

    await tracker.trackSomething({ ...validTags, ...invalidTags });
    const data = {
      ...metricsMeta,
      ...validTags,
    };
    jest.runTimersToTime(60000);
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith(testMeasurementName, 1, data);
    expect(mockLogger.warn).toHaveBeenLastCalledWith('Attempted to track tags with no value', {
      metric: testMeasurementName,
      tagNames: 'anotherInvalidTag, invalidTag',
    });
  });

  it('Should track a metric with multiple values once per value', async () => {
    enum Direction {
      Up = 'Up',
      Down = 'Down',
    }
    enum SystemType {
      A = 'A',
      B = 'B',
    }
    enum Cause {
      A = 'Refund',
      B = 'Credit',
    }

    const metricName = 'measurementName';
    const tags = {
      cause: Cause.A,
      systemType: SystemType.A,
      requestBy: 'software client X',
      direction: Direction.Up,
    };
    const values = {
      amountInPennies: 200,
      repaymentRateAmount: 0.7,
    };

    await trackerWithoutMetricsMeta.trackMultipleValues(metricName, tags, values);

    expect(mockDatadog.distribution).toHaveBeenNthCalledWith(1, `${metricName}.amountInPennies`, 200, tags);
    expect(mockDatadog.distribution).toHaveBeenNthCalledWith(2, `${metricName}.repaymentRateAmount`, 0.7, tags);
  });
});
