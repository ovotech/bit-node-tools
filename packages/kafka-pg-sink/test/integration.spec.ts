import { Client } from 'pg';
import { ObjectReadableMock } from 'stream-mock';
import { Message, PGSinkStream } from '../src';

let pg: Client;

interface TValue1 {
  id: number;
  accountId: string;
}

interface TValue2 {
  dd: number;
  effectiveEnrollmentDate: number;
}

describe('Integration test', () => {
  beforeEach(async () => {
    pg = new Client('postgresql://postgres:dev-pass@0.0.0.0:5432/postgres');
    await pg.connect();
    await pg.query('DROP TABLE IF EXISTS test_1');
    await pg.query('DROP TABLE IF EXISTS test_2');
    await pg.query(`CREATE TABLE test_1 (id INTEGER UNIQUE PRIMARY KEY, event JSONB);`);
    await pg.query(`CREATE TABLE test_2 (id INTEGER UNIQUE PRIMARY KEY, event JSONB);`);
  });

  afterEach(() => pg.end());

  it('Should use PGSinkStream to put data in postgres', async () => {
    const sourceData: Array<Message<TValue1 | TValue2>> = [
      { topic: 'test-topic-1', value: { id: 10, accountId: '111' } },
      { topic: 'test-topic-1', value: { id: 11, accountId: '222' } },
      { topic: 'test-topic-1', value: { id: 12, accountId: '333' } },
      { topic: 'test-topic-1', value: { id: 13, accountId: '444' } },
      { topic: 'test-topic-2', value: { dd: 20, effectiveEnrollmentDate: 17687 } },
      { topic: 'test-topic-2', value: { dd: 22, effectiveEnrollmentDate: 17567 } },
    ];

    const sourceStream = new ObjectReadableMock(sourceData, { objectMode: true });
    const sink = new PGSinkStream<TValue1 | TValue2>({
      pg,
      topics: {
        'test-topic-1': { table: 'test_1', resolver: msg => [(msg.value as TValue1).id, msg.value] },
        'test-topic-2': { table: 'test_2', resolver: msg => [(msg.value as TValue2).dd, msg.value] },
      },
    });

    sourceStream.pipe(sink);

    await new Promise(resolve =>
      sink.on('finish', async () => {
        const { rows: rows1 } = await pg.query('SELECT * FROM test_1');
        const { rows: rows2 } = await pg.query('SELECT * FROM test_2');

        expect(rows1).toEqual([
          { id: 10, event: { id: 10, accountId: '111' } },
          { id: 11, event: { id: 11, accountId: '222' } },
          { id: 12, event: { id: 12, accountId: '333' } },
          { id: 13, event: { id: 13, accountId: '444' } },
        ]);

        expect(rows2).toEqual([
          { id: 20, event: { dd: 20, effectiveEnrollmentDate: 17687 } },
          { id: 22, event: { dd: 22, effectiveEnrollmentDate: 17567 } },
        ]);

        resolve();
      }),
    );
  });
});
