import { KafkaMetricsTracker, ProcessingState } from '../src/kafka';

describe('Track actions relating to consuming an event from Kafka', () => {
  let mockDatadog: any;
  let mockBatchCalls: any;
  let mockLogger: any;
  let tracker: KafkaMetricsTracker;

  beforeEach(() => {
    mockDatadog = { increment: jest.fn().mockResolvedValue(undefined) };
    mockBatchCalls = { addToBatch: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
    tracker = new KafkaMetricsTracker(mockDatadog, mockLogger, {}, mockBatchCalls);
  });

  it('Should track a single event being received', async () => {
    const eventName = 'test-event';
    const ageMs = 123;

    await tracker.trackEventReceived(eventName, ageMs);

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurement: 'kafka-event-received',
      tags: {
        eventName,
      },
      fields: {
        count: 1,
        ageMs,
      },
    });
  });

  it.each([
    [1234.5, 1235],
    [123.4, 123],
    [10, 10],
  ])('Should round event ages to the nearest millisecond: %d', async (exactAge, expectedTrackedAge) => {
    const eventName = 'test-event';

    await tracker.trackEventReceived(eventName, exactAge);

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurement: 'kafka-event-received',
      tags: {
        eventName,
      },
      fields: {
        count: 1,
        ageMs: expectedTrackedAge,
      },
    });
  });

  it.each([ProcessingState.Error, ProcessingState.Success])(
    'Should track the state of a processed event: %s',
    async processingState => {
      const eventName = 'test-event';

      await tracker.trackEventProcessed(eventName, processingState);

      expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
        measurement: 'kafka-event-processed',
        tags: {
          eventName,
          processingState,
        },
        fields: {
          count: 1,
        },
      });
    },
  );
});
