import * as yargs from 'yargs';
import { consume, createTopic, produce, schema, topic } from './commands';

const argv = yargs
  .command(schema)
  .command(topic)
  .command(createTopic)
  .command(produce)
  .command(consume)
  .option('config', { alias: 'c', description: 'Path to the configuration file', default: 'kac.config.json' })
  .epilog('copyright OVO Energy 2018')
  .demandCommand()
  .help().argv;
