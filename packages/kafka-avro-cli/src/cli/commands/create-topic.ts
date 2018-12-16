import chalk from 'chalk';
import { KafkaClient } from 'kafka-node';
import { CommandModule } from 'yargs';
import { loadConfig } from '../config';
import { Args } from '../types';

export interface CreateTopicArgs extends Args {
  topic: string;
  partitions: number;
  'replication-factor': number;
}

export const createTopic: CommandModule = {
  command: 'create-topic <topic>',
  describe: 'Creates a topic in the kafka server with configurable partitions count and replication factor.',
  builder: {
    partitions: { type: 'number', default: 1, description: 'Number of partitions for topic' },
    'replication-factor': { type: 'number', default: 1 },
  },
  handler: async (args: CreateTopicArgs) => {
    const { kafkaClient } = loadConfig(args);

    if (!kafkaClient) {
      throw new Error('Configuration for kafkaClient required, add it to the config file');
    }

    const client = new KafkaClient(kafkaClient);
    const { topic, partitions, 'replication-factor': replicationFactor } = args;

    await new Promise(resolve => client.on('ready', resolve));

    await new Promise((resolve, reject) =>
      (client as any).createTopics([{ topic, partitions, replicationFactor }], (error: Error | null, data: any) => {
        if (error) {
          reject(error);
        } else {
          if (data[0] && data[0].error) {
            reject(new Error(data[0].error));
          } else {
            console.log(
              chalk.green('Topic created'),
              topic,
              chalk.green('partitions'),
              partitions,
              chalk.green('replication factor'),
              replicationFactor,
            );
            client.close(resolve);
          }
        }
      }),
    );
  },
};
