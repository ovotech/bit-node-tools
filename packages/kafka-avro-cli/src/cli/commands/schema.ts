import { getSubjects, getSubjectVersions, getSubjectVersionSchema } from '@ovotech/schema-registry-api';
import chalk from 'chalk';
import * as supportsColor from 'supports-color';
import { URL } from 'url';
import { inspect } from 'util';
import { CommandModule } from 'yargs';
import { Args, filterSearch, loadConfig } from '..';

export interface SchemaArgs extends Args {
  subject: string;
}

export const schema: CommandModule = {
  command: 'schema [subject]',

  describe: `Used to search for, filter and get details of a particular schema in the schema registry. [subject] is a partial name of a subject. If no subject if provided, all subjects are returned.`,
  handler: async (args: SchemaArgs) => {
    const { schemaRegistry } = loadConfig(args);

    if (!schemaRegistry) {
      throw new Error('Configuration for schemaRegistry is required, add it to the config file');
    }

    const url = new URL(schemaRegistry);
    const searchText = `"${args.subject ? args.subject : '<all>'}"`;

    console.log(chalk.gray('Searching for'), searchText, chalk.gray('in'), url.host);
    try {
      const subjects = await getSubjects(schemaRegistry);

      const matchingSubjects = filterSearch(args.subject, subjects);

      switch (matchingSubjects.length) {
        case 0:
          console.log(chalk.red('No subject matching'), chalk.redBright(searchText), chalk.red('found'));
          break;
        case 1:
          const subject = matchingSubjects[0];
          const versions = await getSubjectVersions(schemaRegistry, subject);
          console.log(chalk.gray('Subject'), subject, chalk.gray('found'), versions, chalk.gray('versions'));
          for (const version of versions) {
            const result = await getSubjectVersionSchema(schemaRegistry, subject, version);
            console.log(chalk.yellow('Version:'), version, chalk.yellow('----------------------------------------'));
            console.log(inspect(result, false, 7, Boolean(supportsColor.stdout)));
          }
          break;
        default:
          console.log(chalk.gray('Found'), matchingSubjects.length, chalk.gray('matching'), searchText);
          console.log(chalk.gray('----------------------------------------'));

          for (const item of matchingSubjects) {
            console.log(item);
          }
      }
    } catch (error) {
      console.log(chalk.red('Error'), error.message);
    }
  },
};
