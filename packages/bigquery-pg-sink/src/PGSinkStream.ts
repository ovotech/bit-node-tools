import { Client } from 'pg';
import { Writable } from 'stream';
import { PGSinkStreamOptions } from './types';

export class BigQueryPGSinkStream extends Writable {
  private pg: Client;
  private table: string;
  private insert: (table: string, rows: any[]) => [string, any[]];

  constructor({ pg, table, insert, highWaterMark = 200 }: PGSinkStreamOptions) {
    super({ objectMode: true, highWaterMark });
    this.pg = pg;
    this.table = table;
    this.insert = insert;
  }

  async _writev?(chunks: Array<{ chunk: any; encoding: string }>, callback: (error?: Error | undefined) => void) {
    try {
      const rows = chunks.map(chunk => chunk.chunk);
      await this.pg.query(...this.insert(this.table, rows));
      callback();
    } catch (error) {
      callback(new Error(error));
    }
  }

  async _write(chunk: any, _: string, callback: (err?: Error | undefined) => void): Promise<void> {
    try {
      await this.pg.query(...this.insert(this.table, [chunk]));
      callback();
    } catch (error) {
      callback(new Error(error));
    }
  }
}
