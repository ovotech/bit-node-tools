import { DateType } from '@ovotech/avro-logical-types';
import { Schema } from 'avsc';
import { ReadableMock, WritableMock } from 'stream-mock';
import { AvroProduceRequest, MockAvroSerializer, MockSchemaRegistryResolver } from '../src';

describe('Integration test', () => {
  it('Test Serialier', async () => {
    const sourceData: AvroProduceRequest[] = [
      {
        topic: 'test-topic-1',
        partition: 0,
        key: 'key-1',
        schema: {
          type: 'record',
          name: 'TestSchema1',
          fields: [{ name: 'accountId', type: 'string' }],
        } as Schema,
        messages: [{ accountId: '111' }, { accountId: '222' }],
      },
      {
        topic: 'test-topic-2',
        partition: 1,
        key: 'key-2',
        schema: {
          type: 'record',
          name: 'TestSchema2',
          fields: [{ name: 'effectiveEnrollmentDate', type: { type: 'int', logicalType: 'date' } }],
        } as Schema,
        messages: [
          { effectiveEnrollmentDate: new Date('2018-06-05') },
          { effectiveEnrollmentDate: new Date('2018-02-05') },
        ],
      },
    ];

    const mockSchemaResolver = new MockSchemaRegistryResolver(sourceData);
    const sourceStream = new ReadableMock(sourceData, { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });
    const serializer = new MockAvroSerializer(mockSchemaResolver, { logicalTypes: { date: DateType } });

    sourceStream.pipe(serializer).pipe(sinkStream);

    await new Promise(resolve => {
      sinkStream.on('finish', () => {
        expect(sinkStream.data).toMatchSnapshot();
        resolve();
      });
    });
  });
});
