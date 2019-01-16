import { join } from 'path';
import { executeMigrations, MigrationsReadable, MigrationsWritable } from '../src';

describe('Unit test', () => {
  it('Should use streams to execute migrations', async () => {
    const pg = { query: jest.fn() };

    pg.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: '2018-12-31T11:57:10.022Z' }, { id: '2018-12-31T12:10:49.562Z' }] })
      .mockResolvedValue({});

    const readable = new MigrationsReadable(pg as any, 'test1', join(__dirname, 'migrations'));
    const writable = new MigrationsWritable(pg as any, 'test1');

    readable.pipe(writable);

    await new Promise(resolve => writable.on('finish', resolve));

    expect(pg.query).toBeCalledTimes(6);

    expect(pg.query).toHaveBeenNthCalledWith(1, 'CREATE TABLE IF NOT EXISTS test1 (id VARCHAR PRIMARY KEY)');
    expect(pg.query).toHaveBeenNthCalledWith(2, 'SELECT id FROM test1');
    expect(pg.query).toHaveBeenNthCalledWith(3, 'CREATE TABLE my_test (id INTEGER PRIMARY KEY, name VARCHAR);\n');
    expect(pg.query).toHaveBeenNthCalledWith(4, 'INSERT INTO test1 VALUES ($1)', ['2018-12-31T11:12:39.672Z']);
    expect(pg.query).toHaveBeenNthCalledWith(5, 'ALTER TABLE my_test ADD COLUMN additional_3 VARCHAR;\n');
    expect(pg.query).toHaveBeenNthCalledWith(6, 'INSERT INTO test1 VALUES ($1)', ['2019-01-02T08:36:08.858Z']);
  });

  it('Should await migrate function to run streams', async () => {
    const pg = { query: jest.fn() };

    pg.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: '2018-12-31T12:10:49.562Z' }, { id: '2019-01-02T08:36:08.858Z' }] })
      .mockResolvedValue({});

    const result = await executeMigrations(pg as any, 'testing', join(__dirname, 'migrations'));
    expect(pg.query).toBeCalledTimes(6);

    expect(pg.query).toHaveBeenNthCalledWith(1, 'CREATE TABLE IF NOT EXISTS testing (id VARCHAR PRIMARY KEY)');
    expect(pg.query).toHaveBeenNthCalledWith(2, 'SELECT id FROM testing');
    expect(pg.query).toHaveBeenNthCalledWith(3, 'CREATE TABLE my_test (id INTEGER PRIMARY KEY, name VARCHAR);\n');
    expect(pg.query).toHaveBeenNthCalledWith(4, 'INSERT INTO testing VALUES ($1)', ['2018-12-31T11:12:39.672Z']);
    expect(pg.query).toHaveBeenNthCalledWith(5, 'ALTER TABLE my_test ADD COLUMN additional VARCHAR;\n');
    expect(pg.query).toHaveBeenNthCalledWith(6, 'INSERT INTO testing VALUES ($1)', ['2018-12-31T11:57:10.022Z']);

    expect(result).toMatchSnapshot();
  });
});
