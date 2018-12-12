import { ReadableMock, WritableMock } from 'stream-mock';
import { AvroSerializer, SchemaResolver } from '../src';

describe('Integration test', () => {
  it('Test Serialier', async () => {
    const sourceData = [
      {
        topic: 'test-topic-1',
        schema: {
          type: 'record',
          name: 'TestSchema1',
          fields: [{ name: 'accountId', type: 'string' }],
        },
        messages: [{ accountId: '111' }, { accountId: '222' }],
      },
      {
        topic: 'test-topic-2',
        schema: {
          type: 'record',
          name: 'TestSchema2',
          fields: [{ name: 'effectiveEnrollmentDate', type: { type: 'int', logicalType: 'date' } }],
        },
        messages: [{ effectiveEnrollmentDate: 17687 }, { effectiveEnrollmentDate: 17567 }],
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
    const serializer = new AvroSerializer(schemaResolverMock);

    sourceStream.pipe(serializer).pipe(sinkStream);

    await new Promise(resolve => {
      sinkStream.on('finish', () => {
        expect(schemaResolverMock.toId).toHaveBeenCalledTimes(2);
        expect(schemaResolverMock.toId).toHaveBeenCalledWith(sourceData[0].topic, sourceData[0].schema);
        expect(schemaResolverMock.toId).toHaveBeenCalledWith(sourceData[1].topic, sourceData[1].schema);
        expect(sinkStream.data).toMatchSnapshot();
        resolve();
      });
    });
  });
});
