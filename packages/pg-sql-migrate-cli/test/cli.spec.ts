import { loadConfigFile } from '@ovotech/config-file';
import { Config } from '@ovotech/pg-sql-migrate';
import { startCapture, stopCapture } from 'capture-console';
import chalk from 'chalk';
import { readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { createCommand, executeCommand } from '../src';

const configFile = join(__dirname, 'pg-sql-migrate.config.json');
let pg: Client;
let config: Config;

const deleteMigrations = (dir: string) =>
  readdirSync(dir)
    .filter(file => file.endsWith('pgsql'))
    .forEach(file => unlinkSync(join(dir, file)));

describe('Cli', () => {
  beforeEach(async () => {
    config = loadConfigFile({ file: configFile, env: {} });
    pg = new Client(config.client);
    await pg.connect();
    await pg.query('DROP TABLE IF EXISTS testing; DROP TABLE IF EXISTS my_test;');
    deleteMigrations(config.dir);
  });

  afterEach(async () => {
    deleteMigrations(config.dir);
    await pg.query('DROP TABLE IF EXISTS testing; DROP TABLE IF EXISTS my_test;');
    await pg.end();
  });

  it('Should use streams to execute migrations', async () => {
    writeFileSync(
      join(config.dir, '2018-12-31T11:12:39.672Z_test-things.pgsql'),
      'CREATE TABLE my_test (id INTEGER PRIMARY KEY, name VARCHAR)',
    );
    writeFileSync(
      join(config.dir, '2018-12-31T11:57:10.022Z_test-things2.pgsql'),
      'ALTER TABLE my_test ADD COLUMN additional VARCHAR',
    );

    await executeCommand.handler({ config: configFile });

    await createCommand.handler({
      config: configFile,
      name: 'new',
      content: 'ALTER TABLE my_test ADD COLUMN additional_2 VARCHAR;',
    });

    await executeCommand.handler({ config: configFile });

    const finishedMigrations = await pg.query('SELECT id FROM testing');
    const migratedTable = await pg.query('SELECT * FROM my_test');

    expect(finishedMigrations.rows).toMatchObject([
      { id: '2018-12-31T11:12:39.672Z' },
      { id: '2018-12-31T11:57:10.022Z' },
      { id: expect.any(String) },
    ]);

    expect(migratedTable.fields).toMatchObject([
      expect.objectContaining({ name: 'id' }),
      expect.objectContaining({ name: 'name' }),
      expect.objectContaining({ name: 'additional' }),
      expect.objectContaining({ name: 'additional_2' }),
    ]);
  });

  it('Should use not run migrations on dry run', async () => {
    writeFileSync(
      join(config.dir, '2018-12-31T11:12:39.672Z_test-things.pgsql'),
      'CREATE TABLE my_test (id INTEGER PRIMARY KEY, name VARCHAR)',
    );

    await executeCommand.handler({ config: configFile, 'dry-run': true });

    const finishedMigrations = await pg.query('SELECT id FROM testing');

    expect(finishedMigrations.rows).toHaveLength(0);

    await expect(pg.query('SELECT * FROM my_test')).rejects.toEqual(new Error('relation "my_test" does not exist'));
  });

  it('Should handle error in migration', async () => {
    writeFileSync(join(config.dir, '2018-12-31T11:12:39.672Z_test-things.pgsql'), 'CREATE TABLE');

    let stdout = '';
    let stderr = '';

    startCapture(process.stdout, data => (stdout += data));
    startCapture(process.stderr, data => (stderr += data));

    await executeCommand.handler({ config: configFile });

    stopCapture(process.stdout);
    stopCapture(process.stderr);

    expect(stdout).toEqual(chalk`[2018-12-31T11:12:39.672Z] test-things.pgsql\n{green Finished}\n`);
    expect(stderr).toEqual(chalk`{red Error: syntax error at end of input}\n`);
  });
});
