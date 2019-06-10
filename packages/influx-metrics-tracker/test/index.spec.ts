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
    workspace: 'test-test',
  };
  let mockInflux: any;
  let mockLogger: any;
  let tracker: TestTracker;

  beforeEach(() => {
    mockInflux = { writePoints: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { error: jest.fn(), warn: jest.fn() };
    tracker = new TestTracker(mockInflux, mockLogger, metricsMeta);
  });

  it('Should track valid tags', async () => {
    const tags = { value: 'A string' };

    await tracker.trackSomething(tags, {});

    expect(mockInflux.writePoints).toHaveBeenLastCalledWith([
      {
        measurement: testMeasurementName,
        tags: {
          ...metricsMeta,
          ...tags,
        },
        fields: {},
      },
    ]);
  });

  it('Should track valid metrics', async () => {
    const metrics = { string: 'A string', integer: 3, float: 1.23, boolean: true };

    await tracker.trackSomething({}, metrics);

    expect(mockInflux.writePoints).toHaveBeenLastCalledWith([
      {
        measurement: testMeasurementName,
        tags: {
          ...metricsMeta,
        },
        fields: { ...metrics },
      },
    ]);
  });

  it('Should log rather than track that have empty values', async () => {
    const validTags = { validTag: 'A string' };
    const invalidTags = { invalidTag: '', anotherInvalidTag: '' };

    await tracker.trackSomething({ ...validTags, ...invalidTags }, {});

    expect(mockInflux.writePoints).toHaveBeenLastCalledWith([
      {
        measurement: testMeasurementName,
        tags: {
          ...metricsMeta,
          ...validTags,
        },
        fields: {},
      },
    ]);
    expect(mockLogger.warn).toHaveBeenLastCalledWith('Attempted to track tags with no value', {
      metric: testMeasurementName,
      tagNames: 'anotherInvalidTag, invalidTag',
    });
  });

  it('Should handle influx errors', async () => {
    mockInflux.writePoints.mockRejectedValueOnce('Influx raised an error');

    await tracker.trackSomething({ testTag: 'Bob' }, { timeMs: 0 });

    expect(mockLogger.error).toHaveBeenLastCalledWith('Error tracking Influx metric', {
      metric: testMeasurementName,
      tags: '{"testTag":"Bob"}',
      fields: '{"timeMs":0}',
    });
  });
});
