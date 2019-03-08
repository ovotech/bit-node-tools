import { loadConfig } from '@ovotech/pg-sql-migrate';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { CommandModule } from 'yargs';
import { Args } from './types';

export interface CreateArgs extends Args {
  name: string;
  content: string;
}

export const createCommand: CommandModule<{}, CreateArgs> = {
  command: 'create <name> [content]',
  builder: {
    content: {
      description: 'Contents of the migration',
      default: '',
    },
  },
  describe: 'Create a new migration',
  handler: async args => {
    const { dir } = loadConfig(args.config);
    const file = `${new Date().toISOString()}_${args.name}.pgsql`;

    writeFileSync(join(dir, file), args.content);

    process.stdout.write(chalk`{green Created} ${file}\n`);
  },
};
