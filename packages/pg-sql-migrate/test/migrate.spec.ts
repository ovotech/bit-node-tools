import { loadConfigFile } from '@ovotech/config-file';
import { join } from 'path';
import { Client } from 'pg';
import { migrate } from '../src';

const config = join(__dirname, 'pg-sql-migrate.config.json');
let pg: Client;

describe('Cli', () => {
  beforeEach(async () => {
    const { client } = loadConfigFile({ file: config, env: {} });
    pg = new Client(client);
    await pg.connect();
    await pg.query(`
      DROP TABLE IF EXISTS testing;
      DROP TABLE IF EXISTS testing2;
      DROP TABLE IF EXISTS my_test;
      DROP TABLE IF EXISTS my_test2;
    `);
  });

  afterEach(async () => {
    await pg.end();
  });

  it('Should run migrate function', async () => {
    await migrate(config);

    const finishedMigrations = await pg.query('SELECT id FROM testing');
    const migratedTable = await pg.query('SELECT * FROM my_test');

    expect(finishedMigrations.rows).toEqual([
      { id: '2018-12-31T11:12:39.672Z' },
      { id: '2018-12-31T11:57:10.022Z' },
      { id: '2018-12-31T12:10:49.562Z' },
      { id: '2019-01-02T08:36:08.858Z' },
    ]);

    expect(migratedTable.fields).toMatchObject([
      expect.objectContaining({ name: 'id' }),
      expect.objectContaining({ name: 'name' }),
      expect.objectContaining({ name: 'additional' }),
      expect.objectContaining({ name: 'additional_2' }),
      expect.objectContaining({ name: 'additional_3' }),
    ]);
  });

  it('Should run migrate function with custom config', async () => {
    await migrate({
      client: 'postgresql://postgres:dev-pass@0.0.0.0:5432/postgres',
      dir: 'test/migrations2',
      table: 'testing2',
    });

    const finishedMigrations = await pg.query('SELECT id FROM testing2');
    const migratedTable = await pg.query('SELECT * FROM my_test2');

    expect(finishedMigrations.rows).toEqual([{ id: '2018-12-31T11:12:39.672Z' }]);

    expect(migratedTable.fields).toMatchObject([
      expect.objectContaining({ name: 'id' }),
      expect.objectContaining({ name: 'name' }),
    ]);
  });
});
