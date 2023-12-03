import { RowMetadata } from '@google-cloud/bigquery';
import { Client } from 'pg';
import { Writable } from 'stream';
import { InsertBatch, PGSinkStreamOptions } from './types';

export class BigQueryPGSinkStream extends Writable {
  private pg: Client;
  private insert: (rows: RowMetadata) => InsertBatch[];

  constructor({ pg, insert, highWaterMark = 200 }: PGSinkStreamOptions) {
    super({ objectMode: true, highWaterMark });
    this.pg = pg;
    this.insert = insert;
  }

  async _writev?(
    chunks: Array<{ chunk: RowMetadata; encoding: string }>,
    callback: (error?: Error | undefined) => void,
  ): Promise<void> {
    try {
      const rows = chunks.map(chunk => chunk.chunk);
      const inserts = this.insert(rows);
      for (const insert of inserts) {
        await this.pg.query(insert.query, insert.values);
      }
      callback();
    } catch (error: any) {
      callback(new Error(error));
    }
  }

  async _write(chunk: RowMetadata, _: string, callback: (err?: Error | undefined) => void): Promise<void> {
    try {
      const inserts = this.insert([chunk]);
      for (const insert of inserts) {
        await this.pg.query(insert.query, insert.values);
      }
      callback();
    } catch (error: any) {
      callback(new Error(error));
    }
  }
}
