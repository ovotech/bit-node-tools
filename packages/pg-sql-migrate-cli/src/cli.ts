import { DEFAULT_CONFIG } from '@ovotech/pg-sql-migrate';
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
  .epilog('copyright OVO Energy 2018')
  .demandCommand()
  .help().argv;
