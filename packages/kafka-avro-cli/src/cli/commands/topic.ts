import chalk from 'chalk';
import { KafkaClient } from 'kafka-node';
import * as supportsColor from 'supports-color';
import { inspect } from 'util';
import { CommandModule } from 'yargs';
import { Args, filterSearch, loadConfig } from '..';
import { MetadataResult } from '../../types';

export interface TopicArgs extends Args {
  name: string;
}

export const topic: CommandModule = {
  command: 'topic [name]',
  describe:
    'Used to search for, filter and get details of a particular topic in the kafka server. [name] is a partial name of a topic. If no name if provided, all topics are returned.',
  handler: async (args: TopicArgs) => {
    const { kafkaClient } = loadConfig(args);

    if (!kafkaClient) {
      throw new Error('Configuration for schemaRegistry is required, add it to the config file');
    }

    const searchText = `"${args.name ? args.name : '<all>'}"`;

    console.log(chalk.gray('Searching for'), searchText, chalk.gray('in'), kafkaClient.kafkaHost);

    const client = new KafkaClient(kafkaClient);

    await new Promise(resolve => client.on('ready', resolve));

    const [, { metadata }] = await new Promise<MetadataResult>((resolve, reject) =>
      (client as any).loadMetadataForTopics([], (error: Error | null, results: any) =>
        error ? reject(error) : resolve(results),
      ),
    );

    const topics = Object.keys(metadata);
    const matchingTopics = filterSearch(args.name, topics);

    switch (matchingTopics.length) {
      case 0:
        console.log(chalk.red('No topic matching'), chalk.redBright(searchText), chalk.red('found'));
        break;
      case 1:
        const data = metadata[matchingTopics[0]];
        console.log(chalk.gray('Metadata for'), matchingTopics[0]);
        console.log(chalk.gray('----------------------------------------'));
        console.log(inspect(data, false, 7, Boolean(supportsColor.stdout)));
        break;
      default:
        console.log(chalk.gray('Found'), matchingTopics.length, chalk.gray('matching'), searchText);
        console.log(chalk.gray('----------------------------------------'));

        for (const item of matchingTopics) {
          console.log(item);
        }
    }

    client.close();
  },
};
