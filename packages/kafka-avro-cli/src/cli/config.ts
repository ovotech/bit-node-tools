import { loadConfigFile } from '@ovotech/config-file';
import { existsSync, readFileSync } from 'fs';
import { Args, Config } from './types';

export const loadConfig = (args: Args, required: Array<keyof Config> = []): Config =>
  loadConfigFile<Config>({ env: process.env, file: args.config, required });
