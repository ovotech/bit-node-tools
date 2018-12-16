import { existsSync, readFileSync } from 'fs';
import { Args, Config } from './types';

export const loadConfig = (args: Args): Config => {
  if (!existsSync(args.config)) {
    throw new Error(`Configuration file ${args.config} not found.`);
  }

  return JSON.parse(String(readFileSync(args.config)));
};
