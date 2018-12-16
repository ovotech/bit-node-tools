import { ReadableMock } from 'stream-mock';
import { PGStreamError } from '../src';
import { groupChunks, insertQuery, PGSinkStream } from '../src/PGSinkStream';

const sourceData = [
  { topic: 'test-topic-1', value: { id: 10, accountId: '111' } },
  { topic: 'test-topic-1', value: { id: 11, accountId: '222' } },
  { topic: 'test-topic-1', value: { id: 12, accountId: '333' } },
  { topic: 'test-topic-1', value: { id: 13, accountId: '444' } },
  { topic: 'test-topic-2', value: { ID: 20, effectiveEnrollmentDate: 17687 } },
  { topic: 'test-topic-2', value: { ID: 22, effectiveEnrollmentDate: 17567 } },
];

describe('Integration test', () => {
  it.each([
    ['empty', [], {}],
    [
      'single',
      [{ chunk: { topic: 'topic1', value: 1 }, encoding: 'utf8' }],
      {
        topic1: [{ topic: 'topic1', value: 1 }],
      },
    ],
    [
      'several',
      [
        { chunk: { topic: 'topic1', value: 1 }, encoding: 'utf8' },
        { chunk: { topic: 'topic2', value: 2 }, encoding: 'utf8' },
      ],
      {
        topic1: [{ topic: 'topic1', value: 1 }],
        topic2: [{ topic: 'topic2', value: 2 }],
      },
    ],
    [
      'full',
      [
        { chunk: { topic: 'topic1', value: 1 }, encoding: 'utf8' },
        { chunk: { topic: 'topic1', value: 2 }, encoding: 'utf8' },
        { chunk: { topic: 'topic2', value: 3 }, encoding: 'utf8' },
        { chunk: { topic: 'topic2', value: 3 }, encoding: 'utf8' },
        { chunk: { topic: 'topic3', value: 1 }, encoding: 'utf8' },
        { chunk: { topic: 'topic1', value: 6 }, encoding: 'utf8' },
      ],
      {
        topic1: [{ topic: 'topic1', value: 1 }, { topic: 'topic1', value: 2 }, { topic: 'topic1', value: 6 }],
        topic2: [{ topic: 'topic2', value: 3 }, { topic: 'topic2', value: 3 }],
        topic3: [{ topic: 'topic3', value: 1 }],
      },
    ],
  ])('groupChunks should work for %s', (_, chunks, expected) => {
    expect(groupChunks(chunks)).toEqual(expected);
  });

  it.each([
    ['single', [[100]], ['INSERT INTO single VALUES ($1) ON CONFLICT DO NOTHING', [100]]],
    [
      'multi_value',
      [[100, 200, 'aa']],
      ['INSERT INTO multi_value VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [100, 200, 'aa']],
    ],
    [
      'multi_row',
      [[100, 'c'], [200, 'b'], [300, 'a']],
      ['INSERT INTO multi_row VALUES ($1,$2),($3,$4),($5,$6) ON CONFLICT DO NOTHING', [100, 'c', 200, 'b', 300, 'a']],
    ],
  ])('insertQuery should work for %s', (table, values, expected) => {
    expect(insertQuery(table, values)).toEqual(expected);
  });

  it('Should not batch with low water mark', async () => {
    const pg = { query: jest.fn().mockResolvedValue({}) };
    const sourceStream = new ReadableMock(sourceData, { objectMode: true });

    const pgSinkStream = new PGSinkStream({
      pg: pg as any,
      highWaterMark: 1,
      topics: {
        'test-topic-1': { table: 'test_1', resolver: msg => [(msg.value as any).id, msg.value as any] },
        'test-topic-2': { table: 'test_2', resolver: msg => [(msg.value as any).ID, msg.value as any] },
      },
    });

    sourceStream.pipe(pgSinkStream);

    await new Promise(resolve => {
      pgSinkStream.on('finish', async () => {
        expect(pg.query).toHaveBeenCalledTimes(6);

        expect(pg.query).toHaveBeenNthCalledWith(1, 'INSERT INTO test_1 VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          10,
          { id: 10, accountId: '111' },
        ]);

        expect(pg.query).toHaveBeenNthCalledWith(2, 'INSERT INTO test_1 VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          11,
          { id: 11, accountId: '222' },
        ]);

        expect(pg.query).toHaveBeenNthCalledWith(3, 'INSERT INTO test_1 VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          12,
          { id: 12, accountId: '333' },
        ]);

        expect(pg.query).toHaveBeenNthCalledWith(4, 'INSERT INTO test_1 VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          13,
          { id: 13, accountId: '444' },
        ]);

        expect(pg.query).toHaveBeenNthCalledWith(5, 'INSERT INTO test_2 VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          20,
          { ID: 20, effectiveEnrollmentDate: 17687 },
        ]);

        expect(pg.query).toHaveBeenNthCalledWith(6, 'INSERT INTO test_2 VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          22,
          { ID: 22, effectiveEnrollmentDate: 17567 },
        ]);

        resolve();
      });
    });
  });

  it('Should batch when with high water mark', async () => {
    const pg = { query: jest.fn().mockResolvedValue({}) };
    const sourceStream = new ReadableMock(sourceData, { objectMode: true });

    const pgSinkStream = new PGSinkStream({
      pg: pg as any,
      highWaterMark: 100,
      topics: {
        'test-topic-1': { table: 'test_1', resolver: msg => [(msg.value as any).id, msg.value as any] },
        'test-topic-2': { table: 'test_2', resolver: msg => [(msg.value as any).ID, msg.value as any] },
      },
    });

    sourceStream.pipe(pgSinkStream);

    await new Promise(resolve => {
      pgSinkStream.on('finish', async () => {
        expect(pg.query).toHaveBeenCalledTimes(3);
        expect(pg.query).toHaveBeenNthCalledWith(1, 'INSERT INTO test_1 VALUES ($1,$2) ON CONFLICT DO NOTHING', [
          10,
          { id: 10, accountId: '111' },
        ]);

        expect(pg.query).toHaveBeenNthCalledWith(
          2,
          'INSERT INTO test_1 VALUES ($1,$2),($3,$4),($5,$6) ON CONFLICT DO NOTHING',
          [11, { id: 11, accountId: '222' }, 12, { accountId: '333', id: 12 }, 13, { accountId: '444', id: 13 }],
        );

        expect(pg.query).toHaveBeenNthCalledWith(
          3,
          'INSERT INTO test_2 VALUES ($1,$2),($3,$4) ON CONFLICT DO NOTHING',
          [20, { ID: 20, effectiveEnrollmentDate: 17687 }, 22, { ID: 22, effectiveEnrollmentDate: 17567 }],
        );
        resolve();
      });
    });
  });

  it('Should handle pg error', async () => {
    const pg = {
      query: jest
        .fn()
        .mockRejectedValueOnce(new Error('pg error'))
        .mockResolvedValue({}),
    };
    const sourceStream = new ReadableMock(sourceData, { objectMode: true });

    const pgSinkStream = new PGSinkStream({
      pg: pg as any,
      topics: {
        'test-topic-1': { table: 'test_1', resolver: msg => [(msg.value as any).id, msg.value as any] },
        'test-topic-2': { table: 'test_2', resolver: msg => [(msg.value as any).ID, msg.value as any] },
      },
    });

    sourceStream.pipe(pgSinkStream);

    await new Promise(resolve => {
      pgSinkStream.on('error', error => {
        expect(error).toEqual(new Error('pg error'));
        resolve();
      });
    });
  });

  it('Should handle batch pg error', async () => {
    const pg = {
      query: jest
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('pg error'))
        .mockResolvedValue({}),
    };
    const sourceStream = new ReadableMock(sourceData, { objectMode: true });

    const pgSinkStream = new PGSinkStream({
      pg: pg as any,
      topics: {
        'test-topic-1': { table: 'test_1', resolver: msg => [(msg.value as any).id, msg.value as any] },
        'test-topic-2': { table: 'test_2', resolver: msg => [(msg.value as any).ID, msg.value as any] },
      },
    });

    sourceStream.pipe(pgSinkStream);

    await new Promise(resolve => {
      pgSinkStream.on('error', error => {
        expect(error).toEqual(new Error('pg error'));
        resolve();
      });
    });
  });

  it('Should handle missing topic', async () => {
    const pg = {
      query: jest.fn().mockResolvedValue({}),
    };
    const sourceStream = new ReadableMock(sourceData, { objectMode: true });

    const pgSinkStream = new PGSinkStream({
      pg: pg as any,
      topics: {},
    });

    sourceStream.pipe(pgSinkStream);

    await new Promise(resolve => {
      pgSinkStream.on('error', error => {
        expect(error).toEqual(
          new PGStreamError(
            `Config not found for topic "test-topic-1", you'll need to add it in the options for PGSinkStream constructor`,
          ),
        );
        resolve();
      });
    });
  });
});
