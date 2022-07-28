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
  let mockBatchCalls: any;
  let tracker: TestTracker;

  beforeEach(() => {
    mockDatadog = { increment: jest.fn() };
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
    mockBatchCalls = { addToBatch: jest.fn() };
    tracker = new TestTracker(mockDatadog, mockLogger, mockBatchCalls);
  });

  it('Should track valid tags and write the points to Datadog in a batch call', async () => {
    const tags = { value: 'A string' };

    await tracker.trackSomething(tags, {});

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurement: testMeasurementName,
      tags: {
        ...metricsMeta,
        ...tags,
      },
      fields: {},
    });
  });

  it('Should track valid metrics and write the points to Datadog in a batch call', async () => {
    const metrics = { string: 'A string', integer: 3, float: 1.23, boolean: true };

    await tracker.trackSomething({}, metrics);

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurement: testMeasurementName,
      tags: {
        ...metricsMeta,
      },
      fields: { ...metrics },
    });
  });

  it('Should log rather than track that have empty values', async () => {
    const validTags = { validTag: 'A string' };
    const invalidTags = { invalidTag: '', anotherInvalidTag: '' };

    await tracker.trackSomething({ ...validTags, ...invalidTags }, {});

    jest.runTimersToTime(60000);
    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurement: testMeasurementName,
      tags: {
        ...metricsMeta,
        ...validTags,
      },
      fields: {},
    });
    expect(mockLogger.warn).toHaveBeenLastCalledWith('Attempted to track tags with no value', {
      metric: testMeasurementName,
      tagNames: 'anotherInvalidTag, invalidTag',
    });
  });
});
