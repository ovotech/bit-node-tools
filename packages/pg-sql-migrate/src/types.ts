import { ClientConfig } from 'pg';

export interface Config {
  client: ClientConfig | string;
  dir: string;
  table: string;
}

export interface Migration {
  id: string;
  name: string;
  content: string;
}

export const DEFAULT_CONFIG = 'pg-sql-migrate.config.json';

export const CONFIG_DEFAULTS = {
  dir: 'migrations',
  table: 'migrations',
};
