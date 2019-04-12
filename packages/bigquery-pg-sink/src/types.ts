import { Client } from 'pg';

export interface PGSinkStreamOptions {
  pg: Client;
  table: string;
  insert: (table: string, rows: any[]) => [string, any[]];
  highWaterMark?: number;
}
