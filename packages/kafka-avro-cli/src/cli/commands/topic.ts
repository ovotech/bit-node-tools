import chalk from 'chalk';
import { KafkaClient, Offset } from 'kafka-node';
import * as supportsColor from 'supports-color';
import { inspect } from 'util';
import { CommandModule } from 'yargs';
import { Args, filterSearch, loadConfig } from '..';
import { MetadataResult } from '../../types';

export interface TopicArgs extends Args {
  name: string;
}

export const topic: CommandModule<{}, TopicArgs> = {
  command: 'topic [name]',
  describe:
    'Used to search for, filter and get details of a particular topic in the kafka server. [name] is a partial name of a topic. If no name if provided, all topics are returned.',
  handler: async args => {
    const { kafkaClient } = loadConfig(args, ['kafkaClient']);

    const searchText = `"${args.name ? args.name : '<all>'}"`;

    process.stdout.write(chalk`{gray Searching for} ${searchText} {gray in} ${String(kafkaClient!.kafkaHost)}\n`);

    const client = new KafkaClient(kafkaClient);

    await new Promise(resolve => client.on('ready', () => resolve(null)));

    const [, { metadata }] = await new Promise<MetadataResult>((resolve, reject) =>
      (client as any).loadMetadataForTopics([], (error: Error | null, results: any) =>
        error ? reject(error) : resolve(results),
      ),
    );

    const topics = Object.keys(metadata);
    const matchingTopics = filterSearch(args.name, topics);

    switch (matchingTopics.length) {
      case 0:
        process.stdout.write(chalk`{red No topic matching} {redBright ${searchText}} {red found}\n`);
        break;
      case 1:
        const data = metadata[matchingTopics[0]];
        const clientOffset = new Offset(client);
        const offsets = await new Promise((resolve, reject) =>
          clientOffset.fetch(
            Object.keys(data).map(partition => ({ topic: matchingTopics[0], partition: Number(partition) })),
            (err: any, offset: any) => (err ? reject(err) : resolve(offset)),
          ),
        );

        process.stdout.write(chalk`{gray Partitions and their offsets for} ${matchingTopics[0]}\n`);
        process.stdout.write(chalk`{gray ----------------------------------------}\n`);
        process.stdout.write(inspect(offsets, false, 7, Boolean(supportsColor.stdout)) + '\n');
        break;
      default:
        process.stdout.write(chalk`{gray Found} ${String(matchingTopics.length)} {gray matching} ${searchText}\n`);
        process.stdout.write(chalk`{gray ----------------------------------------}\n`);

        for (const item of matchingTopics) {
          process.stdout.write(`${item}\n`);
        }
    }

    client.close();
  },
};
