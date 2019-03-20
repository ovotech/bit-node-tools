import { getSubjects, getSubjectVersions, getSubjectVersionSchema } from '@ovotech/schema-registry-api';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as supportsColor from 'supports-color';
import { URL } from 'url';
import { inspect } from 'util';
import { CommandModule } from 'yargs';
import { Args, filterSearch, loadConfig } from '..';

export interface SchemaArgs extends Args {
  subject: string;
  'output-dir': string;
}

export const schema: CommandModule<{}, SchemaArgs> = {
  command: 'schema [subject]',
  builder: {
    'output-dir': {
      alias: 'o',
      description: 'Save the results into a folder. One file per version',
    },
  },
  describe: `Used to search for, filter and get details of a particular schema in the schema registry. [subject] is a partial name of a subject. If no subject if provided, all subjects are returned.`,
  handler: async args => {
    const { schemaRegistry } = loadConfig(args, ['schemaRegistry']);

    const url = new URL(schemaRegistry!);
    const searchText = `"${args.subject ? args.subject : '<all>'}"`;

    process.stdout.write(chalk`{gray Searching for} ${searchText} {gray in} ${url.host}\n`);
    try {
      const subjects = await getSubjects(schemaRegistry!);

      const matchingSubjects = filterSearch(args.subject, subjects);

      switch (matchingSubjects.length) {
        case 0:
          process.stdout.write(chalk`{red No subject matching} {redBright ${searchText}} {red found}\n`);
          break;
        case 1:
          const subject = matchingSubjects[0];
          const versions = await getSubjectVersions(schemaRegistry!, subject);
          process.stdout.write(chalk`{gray Subject} ${subject} {gray found} ${String(versions)} {gray versions}\n`);
          for (const version of versions) {
            const result = await getSubjectVersionSchema(schemaRegistry!, subject, version);
            if (args['output-dir']) {
              process.stdout.write(chalk`{yellow Saving to dir} ${args['output-dir']}\n`);
              const filename = `${subject}.${version}.avsc`;
              writeFileSync(join(args['output-dir'], filename), JSON.stringify(result, null, 2));
              process.stdout.write(chalk`{yellow Save verison to} ${filename}\n`);
            } else {
              process.stdout.write(
                chalk`{yellow Version} ${String(version)} {yellow ----------------------------------------}\n`,
              );
              process.stdout.write(inspect(result, false, 14, Boolean(supportsColor.stdout)) + '\n');
            }
          }
          break;
        default:
          process.stdout.write(chalk`{gray Found} ${String(matchingSubjects.length)} {gray matching} ${searchText}\n`);
          process.stdout.write(chalk`{gray ----------------------------------------}\n`);

          for (const item of matchingSubjects) {
            process.stdout.write(`${item}\n`);
          }
      }
    } catch (error) {
      process.stderr.write(chalk`{red Error ${error.message}}\n`);
    }
  },
};
