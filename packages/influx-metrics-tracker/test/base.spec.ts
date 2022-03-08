import { MetricsTracker } from '../src';

const testMeasurementName = 'test-metrics';

export class TestTracker extends MetricsTracker {
  private static testMeasurementName = testMeasurementName;

  async trackSomething(tags: { [name: string]: string }, fields: { [name: string]: any }) {
    await this.trackPoint(TestTracker.testMeasurementName, tags, fields);
  }
}

describe('Base metrics class', () => {
  const metricsMeta = {
    extraTagName: 'some-value',
  };
  let mockInflux: any;
  let mockBatchCalls: any;
  let mockLogger: any;
  let tracker: TestTracker;

  beforeEach(() => {
    mockInflux = {};
    mockBatchCalls = { addToBatch: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { error: jest.fn(), warn: jest.fn() };
    tracker = new TestTracker(mockInflux, mockLogger, metricsMeta, mockBatchCalls);
  });

  it('Should track valid tags', async () => {
    const tags = { value: 'A string' };

    await tracker.trackSomething(tags, {});

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurementName: testMeasurementName,
      tags: {
        ...metricsMeta,
        ...tags,
      },
      fields: {},
    });
  });

  it('Should track valid metrics', async () => {
    const metrics = { string: 'A string', integer: 3, float: 1.23, boolean: true };

    await tracker.trackSomething({}, metrics);

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurementName: testMeasurementName,
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

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurementName: testMeasurementName,
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
