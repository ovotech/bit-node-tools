import { DateType } from '@ovotech/avro-logical-types';
import { ReadableMock, WritableMock } from 'stream-mock';
import { AvroDeserializer, SchemaResolver } from '../src';

describe('AvroDeserializer test', () => {
  it('Test stream transform', async () => {
    const schemas = [
      {
        type: 'record',
        name: 'TestSchema1',
        fields: [{ name: 'accountId', type: 'string' }],
      },
      {
        type: 'record',
        name: 'TestSchema2',
        fields: [{ name: 'effectiveEnrollmentDate', type: { type: 'int', logicalType: 'date' } }],
      },
    ];

    const sourceData = [
      { topic: 'test-topic-1', value: new Buffer([0, 0, 0, 0, 1, 6, 49, 49, 49]) },
      { topic: 'test-topic-1', value: new Buffer([0, 0, 0, 0, 1, 6, 50, 50, 50]) },
      { topic: 'test-topic-2', value: new Buffer([0, 0, 0, 0, 2, 174, 148, 2]) },
      { topic: 'test-topic-2', value: new Buffer([0, 0, 0, 0, 2, 190, 146, 2]) },
    ];

    const schemaResolverMock: SchemaResolver = {
      toId: jest.fn(),
      fromId: jest
        .fn()
        .mockResolvedValueOnce(schemas[0])
        .mockResolvedValueOnce(schemas[0])
        .mockResolvedValueOnce(schemas[1])
        .mockResolvedValueOnce(schemas[1]),
    };

    const sourceStream = new ReadableMock(sourceData, { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });
    const serializer = new AvroDeserializer(schemaResolverMock, { logicalTypes: { date: DateType } });

    sourceStream.pipe(serializer).pipe(sinkStream);

    await new Promise(resolve => {
      sinkStream.on('finish', () => {
        expect(schemaResolverMock.fromId).toHaveBeenCalledTimes(4);
        expect(schemaResolverMock.fromId).toHaveBeenNthCalledWith(1, 1);
        expect(schemaResolverMock.fromId).toHaveBeenNthCalledWith(2, 1);
        expect(schemaResolverMock.fromId).toHaveBeenNthCalledWith(3, 2);
        expect(schemaResolverMock.fromId).toHaveBeenNthCalledWith(4, 2);
        expect(sinkStream.data).toMatchSnapshot();
        resolve();
      });
    });
  });

  it('Test wrong stream type', async () => {
    const schemaResolverMock: SchemaResolver = { toId: jest.fn(), fromId: jest.fn() };
    const sourceStream = new ReadableMock([{ topic: 't1', value: 'test' }], { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });
    const serializer = new AvroDeserializer(schemaResolverMock);

    sourceStream.pipe(serializer).pipe(sinkStream);

    await new Promise(resolve => {
      serializer.on('error', (error: Error) => {
        expect(error).toEqual(new Error('ConsumerGroupStream for topic "t1" must set the encoding to "buffer"'));
        resolve();
      });
    });
  });
});
