import { AvroDeserializer } from '@ovotech/avro-stream';
import chalk from 'chalk';
import { ConsumerGroupStream } from 'kafka-node';
import * as uuid from 'uuid';
import { CommandModule } from 'yargs';
import {
  ConsumerProgressTransform,
  FileWritable,
  LogConsumerProgressTransform,
  NullWritable,
  StopOnFinishProgressTransform,
} from '../../';
import { loadConfig } from '../config';
import { Args } from '../types';

export interface ConsumeArgs extends Args {
  group: string;
  topic: string;
  tail: boolean;
  'output-file': string;
}

export const consume: CommandModule = {
  command: 'consume <topic>',
  describe: 'Consume events from kafka topic. Display them in the console or save them to a file',
  builder: {
    group: {
      default: `kafka-avro-cli-${uuid.v4()}`,
      description: 'Consumer Group Id',
      defaultDescription: 'a prefixed random name',
    },
    tail: { type: 'boolean', default: false, description: 'Keep listening after all messages consumed' },
    'output-file': {
      alias: 'o',
      description: 'Save the results into a file, that can later be used to produce those events',
    },
  },
  handler: (args: ConsumeArgs) => {
    const { kafkaClient, schemaRegistry } = loadConfig(args);

    if (!kafkaClient || !schemaRegistry) {
      throw new Error('Configuration for kafkaClient and schemaRegistryis required, add it to the config file');
    }

    const consumerStream = new ConsumerGroupStream(
      {
        ...kafkaClient,
        groupId: args.group,
        encoding: 'buffer',
        fromOffset: 'earliest',
      },
      [args.topic],
    );

    const deserialier = new AvroDeserializer(schemaRegistry);
    const consumerProgress = new ConsumerProgressTransform(consumerStream);
    const stopOnFinishProgress = new StopOnFinishProgressTransform(consumerStream, !args.tail);
    const logConsumerProgress = new LogConsumerProgressTransform(!args['output-file']);

    const errorHandler = (title: string) => (error: Error) => {
      console.log(chalk.red(`Error in ${title}`), error.message);
      consumerStream.close(() => {
        console.log('Consumer closed');
      });
    };

    consumerStream.on('error', errorHandler('kafka consumer'));
    deserialier.on('error', errorHandler('deserializer'));
    consumerProgress.on('error', errorHandler('progress bar'));
    stopOnFinishProgress.on('error', errorHandler('stop on finish counter'));
    logConsumerProgress.on('error', errorHandler('logger'));

    const stream = consumerStream
      .pipe(consumerProgress)
      .pipe(stopOnFinishProgress)
      .pipe(deserialier)
      .pipe(logConsumerProgress);

    if (args['output-file']) {
      const fileWritable = new FileWritable(args['output-file']);

      console.log(chalk.gray('Writing to file'), args['output-file'], chalk.gray('from topic'), args.topic);
      console.log(chalk.gray('----------------------------------------'));

      stream.pipe(fileWritable);
    } else {
      const end = new NullWritable();

      console.log(chalk.gray('Consume messages in'), args.topic);
      console.log(chalk.gray('----------------------------------------'));

      stream.pipe(end);
    }
  },
};
