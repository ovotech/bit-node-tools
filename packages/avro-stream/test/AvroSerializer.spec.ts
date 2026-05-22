import { DateType } from '@ovotech/avro-logical-types';
import { Schema } from 'avsc';
import { ReadableMock, WritableMock } from 'stream-mock';
import { AvroProduceRequest, AvroSerializer, AvroSerializerError, SchemaResolver } from '../src';

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

    const schemaResolverMock: SchemaResolver = {
      toId: jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2),
      fromId: jest.fn(),
    };

    const sourceStream = new ReadableMock(sourceData, { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });
    const serializer = new AvroSerializer(schemaResolverMock, { logicalTypes: { date: DateType } });

    sourceStream.pipe(serializer).pipe(sinkStream);

    await new Promise<void>(resolve => {
      sinkStream.on('finish', () => {
        expect(schemaResolverMock.toId).toHaveBeenCalledTimes(2);
        expect(schemaResolverMock.toId).toHaveBeenCalledWith(sourceData[0].topic, sourceData[0].schema);
        expect(schemaResolverMock.toId).toHaveBeenCalledWith(sourceData[1].topic, sourceData[1].schema);
        expect(sinkStream.data).toMatchSnapshot();
        resolve();
      });
    });
  });

  it('Test wrong data', async () => {
    const sourceData: AvroProduceRequest[] = [
      {
        topic: 'test-topic-1',
        partition: 0,
        key: 'key-1',
        schema: {
          type: 'record',
          name: 'TestSchema1',
          fields: [{ name: 'accountId', type: 'string' }],
        },
        messages: [{ accountId: '111' }, { accountId: '222' }],
      },
    ];
    const schemaError = new Error('schema problem');
    const schemaResolverMock: SchemaResolver = {
      toId: jest.fn().mockRejectedValueOnce(schemaError),
      fromId: jest.fn(),
    };

    const sourceStream = new ReadableMock(sourceData, { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });
    const serializer = new AvroSerializer(schemaResolverMock);

    sourceStream.pipe(serializer).pipe(sinkStream);

    await new Promise<void>(resolve => {
      serializer.on('error', (error: AvroSerializerError) => {
        expect(error).toBeInstanceOf(AvroSerializerError);
        expect(error).toMatchObject({
          message: 'schema problem',
          chunk: {
            key: 'key-1',
            messages: [{ accountId: '111' }, { accountId: '222' }],
            partition: 0,
            schema: { fields: [{ name: 'accountId', type: 'string' }], name: 'TestSchema1', type: 'record' },
            topic: 'test-topic-1',
          },
          encoding: 'utf8',
          originalError: schemaError,
        });
        resolve();
      });
    });
  });
});
