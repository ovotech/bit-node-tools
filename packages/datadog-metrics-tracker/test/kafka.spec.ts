import { KafkaMetricsTracker, ProcessingState } from '../src/kafka';

describe('Track actions relating to consuming an event from Kafka', () => {
  let mockDatadog: any;
  let mockLogger: any;
  let tracker: KafkaMetricsTracker;

  beforeEach(() => {
    mockDatadog = { distribution: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
    tracker = new KafkaMetricsTracker(mockDatadog, mockLogger, {});
  });

  it('Should track a single event being received', async () => {
    const eventName = 'test-event';
    const ageMs = 123;

    await tracker.trackEventReceived(eventName, ageMs);
    const data = {
      eventName,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith('kafka-event-received', 1, data);
  });

  it.each([
    [1234.5, 1235],
    [123.4, 123],
    [10, 10],
  ])('Should round event ages to the nearest millisecond: %d', async (exactAge, expectedTrackedAge) => {
    const eventName = 'test-event';

    await tracker.trackEventReceived(eventName, exactAge);
    const data = {
      eventName,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith('kafka-event-received', 1, data);
  });

  it.each([ProcessingState.Error, ProcessingState.Success])(
    'Should track the state of a processed event: %s',
    async processingState => {
      const eventName = 'test-event';

      await tracker.trackEventProcessed(eventName, processingState);
      const data = {
        eventName,
        processingState,
      };
      expect(mockDatadog.distribution).toHaveBeenLastCalledWith('kafka-event-processed', 1, data);
    },
  );
});
