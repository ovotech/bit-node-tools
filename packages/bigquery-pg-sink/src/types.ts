import { Logger } from '@ovotech/winston-logger';
import { Client } from 'pg';

export interface PGSinkStreamOptions {
  pg: Client;
  table: string;
  insert: (table: string, rows: any[]) => [string, any[]];
  logger: Logger;
  highWaterMark?: number;
}
