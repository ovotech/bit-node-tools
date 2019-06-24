import { KafkaMetricsTracker, ProcessingState } from '../src/kafka';

describe('Track actions relating to consuming an event from Kafka', () => {
  let mockInflux: any;
  let mockLogger: any;
  let tracker: KafkaMetricsTracker;

  beforeEach(() => {
    mockInflux = { writePoints: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { error: jest.fn(), warn: jest.fn() };
    tracker = new KafkaMetricsTracker(mockInflux, mockLogger);
  });

  it('Should track a single event being received', async () => {
    const eventName = 'test-event';
    const ageMs = 123;

    await tracker.trackEventReceived(eventName, ageMs);

    expect(mockInflux.writePoints).toHaveBeenLastCalledWith([
      {
        measurement: 'kafka-event-received',
        tags: {
          eventName,
        },
        fields: {
          count: 1,
          ageMs,
        },
      },
    ]);
  });

  it.each([ProcessingState.Error, ProcessingState.Success])(
    'Should track the state of a processed event: %s',
    async processingState => {
      const eventName = 'test-event';

      await tracker.trackEventProcessed(eventName, processingState);

      expect(mockInflux.writePoints).toHaveBeenLastCalledWith([
        {
          measurement: 'kafka-event-processed',
          tags: {
            eventName,
            processingState,
          },
          fields: {
            count: 1,
          },
        },
      ]);
    },
  );
});
