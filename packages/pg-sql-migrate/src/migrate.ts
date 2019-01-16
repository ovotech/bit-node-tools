import { loadConfigFile } from '@ovotech/config-file';
import { Client, ClientBase } from 'pg';
import { MigrationsReadable, MigrationsWritable } from './';
import { Config, CONFIG_DEFAULTS, DEFAULT_CONFIG, Migration } from './types';

export const executeMigrations = (clientBase: ClientBase, table: string, dir: string): Promise<Migration[]> => {
  return new Promise((resolve, reject) => {
    const migrations = new MigrationsReadable(clientBase, table, dir);
    const sink = new MigrationsWritable(clientBase, table);
    const results: Migration[] = [];

    sink.on('finish', () => resolve(results));
    sink.on('error', reject);
    migrations.on('error', reject);
    migrations.on('data', data => results.push(data));
    migrations.pipe(sink);
  });
};

export const loadConfig = (file = DEFAULT_CONFIG, env = process.env) => {
  return loadConfigFile<Config>({
    file,
    env,
    defaults: CONFIG_DEFAULTS,
    required: ['client'],
  });
};

export const migrate = async (config?: Config | string, env = process.env) => {
  const { client, table, dir } = typeof config === 'object' ? config : loadConfig(config);

  const pg = new Client(client);
  await pg.connect();
  const results = await executeMigrations(pg, table, dir);
  await pg.end();
  return results;
};
