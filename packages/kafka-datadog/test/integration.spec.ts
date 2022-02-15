import { Castle, produce } from '@ovotech/castle';
import { Schema } from 'avsc';
import { HelloWorldV1 } from '../test/topics/__generated__/hello_world_v1.json';
import * as HelloWorldSchema from '../test/topics/schemas/hello_world_v1.json';
import { retry } from 'ts-retry-promise';

interface Tags {
  [key: string]: string;
}

interface MetricsTracker<L extends string> {
  timing(stat: L, value: number | Date, tags?: Tags | string[]): void;
}

interface ExtendedGlobal extends NodeJS.Global {
  castle: Castle;
  metrics: MetricsTracker<string>;
}

declare let global: ExtendedGlobal;

describe('datadog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const produceFunction = produce<HelloWorldV1>({
    topic: 'hello_world_v1',
    schema: HelloWorldSchema as Schema,
  });

  it('Issues a metric for consumption latency when a message is consumed', async () => {
    await produceFunction(global.castle.producer, [
      {
        key: null,
        value: {
          message: 'Hello World',
          metadata: {
            eventId: 'test-event-id',
            createdAt: new Date(),
            traceToken: 'test-trace-token',
          },
        } as HelloWorldV1,
      },
    ]);

    await retry(async () => {
      expect(global.metrics.timing).toBeCalledWith('kafka_consumer.consumption_latency', expect.any(Number), {
        topic: 'hello_world_v1',
      });
      return Promise.resolve();
    });
  });
});
