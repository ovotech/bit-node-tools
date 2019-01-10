import { AvroSerializer } from '@ovotech/avro-stream';
import chalk from 'chalk';
import { ProducerStream } from 'kafka-node';
import { CommandModule } from 'yargs';
import { FileReadable, LogProducerTransform } from '../../';
import { loadConfig } from '../config';
import { Args } from '../types';

export interface ProduceArgs extends Args {
  file: string;
}

export const produce: CommandModule = {
  command: 'produce [file]',
  describe: 'Produce events in kafka topic from a file',
  handler: (args: ProduceArgs) => {
    const { kafkaClient, schemaRegistry } = loadConfig(args);

    if (!kafkaClient || !schemaRegistry) {
      throw new Error('Configuration for kafkaClient and schemaRegistryis required, add it to the config file');
    }
    const producerStream = new ProducerStream({ kafkaClient });
    const fileReadable = new FileReadable(args.file);
    const serializer = new AvroSerializer(schemaRegistry);
    const logProducer = new LogProducerTransform();

    const errorHandler = (title: string) => (error: Error) => {
      console.log(chalk.red(`Error in ${title}`), error.message);
      producerStream.close();
    };

    producerStream.on('finish', () => {
      producerStream.close();
    });

    fileReadable.on('error', errorHandler('reading file data'));
    logProducer.on('error', errorHandler('logging'));
    serializer.on('error', errorHandler('serializing'));
    producerStream.on('error', errorHandler('producing kafka event'));

    fileReadable
      .pipe(logProducer)
      .pipe(serializer)
      .pipe(producerStream);
  },
};
