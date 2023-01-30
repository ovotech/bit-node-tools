import { MetricsTracker } from '../src';

const testMeasurementName = 'test-metrics';

export class TestTracker extends MetricsTracker {
  private static testMeasurementName = testMeasurementName;

  async trackSomething(tags: { [name: string]: string }, fields: { [name: string]: any }) {
    await this.trackPoint(TestTracker.testMeasurementName, tags, fields);
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

  beforeEach(() => {
    mockDatadog = { distribution: jest.fn() };
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
    tracker = new TestTracker(mockDatadog, mockLogger, metricsMeta);
  });

  it('Should track valid tags and write the points to Datadog in a batch call', async () => {
    const tags = { value: 'A string' };

    await tracker.trackSomething(tags, {});
    const data = {
      ...metricsMeta,
      ...tags,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith(testMeasurementName,1, data);
  });

  it('Should track valid metrics and write the points to Datadog in a batch call', async () => {
    const metrics = { string: 'A string', integer: 3, float: 1.23, boolean: true };

    await tracker.trackSomething({}, metrics);
    const data = {
      ...metricsMeta,
      ...metrics,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith(testMeasurementName,1, data);
  });

  it('Should log rather than track that have empty values', async () => {
    const validTags = { validTag: 'A string' };
    const invalidTags = { invalidTag: '', anotherInvalidTag: '' };

    await tracker.trackSomething({ ...validTags, ...invalidTags }, {});
    const data = {
      ...metricsMeta,
      ...validTags,
    };
    jest.runTimersToTime(60000);
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith(testMeasurementName,1, data);
    expect(mockLogger.warn).toHaveBeenLastCalledWith('Attempted to track tags with no value', {
      metric: testMeasurementName,
      tagNames: 'anotherInvalidTag, invalidTag',
    });
  });
});
