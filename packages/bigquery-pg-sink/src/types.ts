import { Client } from 'pg';
import { RowMetadata } from '@google-cloud/bigquery';

export interface InsertBatch {
  query: string;
  values: any[];
}

export interface PGSinkStreamOptions {
  pg: Client;
  insert: (rows: RowMetadata) => InsertBatch[];
  highWaterMark?: number;
}
