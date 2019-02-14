import { DEFAULT_CONFIG } from '@ovotech/pg-sql-migrate';
import chalk from 'chalk';
import * as yargs from 'yargs';
import { createCommand, executeCommand } from '.';

const argv = yargs
  .command(executeCommand)
  .command(createCommand)
  .option('config', {
    alias: 'c',
    description: 'Path to the configuration file',
    default: DEFAULT_CONFIG,
  })
  .fail((msg, err) => {
    process.stderr.write(chalk`{red Error: ${msg || err.message}}\n`);
    process.exit(1);
  })
  .epilog('copyright OVO Energy 2018')
  .demandCommand()
  .help().argv;
