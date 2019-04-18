import { WritableMock } from 'stream-mock';
import { AvroTopicSender } from '../src';

describe('AvroDeserializer test', () => {
  it('Should produce events', async () => {
    const sender = new AvroTopicSender<{ accountId: string }>({
      topic: 'test-topic-1',
      partition: 0,
      key: 'key-1',
      schema: {
        type: 'record',
        name: 'TestSchema1',
        fields: [{ name: 'accountId', type: 'string' }],
      },
    });

    const end = new WritableMock({ objectMode: true });

    sender.pipe(end);
    sender.send({ accountId: '222' }, { accountId: '111' });
    sender.send({ accountId: '333' });
    sender.close();

    await new Promise(resolve => end.on('finish', resolve));

    expect(end.data).toEqual([
      {
        topic: 'test-topic-1',
        partition: 0,
        key: 'key-1',
        schema: { type: 'record', name: 'TestSchema1', fields: [{ name: 'accountId', type: 'string' }] },
        messages: [{ accountId: '222' }, { accountId: '111' }],
      },
      {
        topic: 'test-topic-1',
        partition: 0,
        key: 'key-1',
        schema: { type: 'record', name: 'TestSchema1', fields: [{ name: 'accountId', type: 'string' }] },
        messages: [{ accountId: '333' }],
      },
    ]);
  });
});
