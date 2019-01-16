import { loadConfig, Migration, MigrationsReadable, MigrationsWritable } from '@ovotech/pg-sql-migrate';
import chalk from 'chalk';
import { Client } from 'pg';
import { CommandModule } from 'yargs';
import { NullWritable } from './';
import { Args } from './types';

export interface ExecuteArgs extends Args {
  'dry-run': boolean;
}

export const executeCommand: CommandModule = {
  command: 'execute',
  describe: 'Execute outstanding migrations',
  builder: {
    'dry-run': {
      type: 'boolean',
      description: 'Output results without running the migrations',
    },
  },
  handler: async (args: ExecuteArgs) => {
    const { client, table, dir } = loadConfig(args.config);

    const pg = new Client(client);
    await pg.connect();

    await new Promise(resolve => {
      const migrations = new MigrationsReadable(pg, table, dir);
      const sink = args['dry-run'] ? new NullWritable() : new MigrationsWritable(pg, table);

      const errorHandler = async (error: Error) => {
        process.stderr.write(chalk`{red Error: ${error.message}}\n`);
        await pg.end();
        resolve();
      };

      const finishHanler = async () => {
        process.stdout.write(chalk`{green Finished}\n`);
        await pg.end();
        resolve();
      };

      migrations.on('error', errorHandler);
      migrations.on('data', (data: Migration) => process.stdout.write(`[${data.id}] ${data.name}\n`));
      sink.on('error', errorHandler);
      sink.on('finish', finishHanler);

      migrations.pipe(sink);
    });
  },
};
