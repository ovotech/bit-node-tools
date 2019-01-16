import { ClientBase } from 'pg';
import { Writable } from 'stream';
import { MigrationError } from './MigrationError';
import { Migration } from './types';

export class MigrationsWritable extends Writable {
  constructor(private pg: ClientBase, private table: string) {
    super({ objectMode: true });
  }

  async _write(migration: Migration, encoding: string, callback: (error?: Error | null) => void) {
    try {
      await this.pg.query(migration.content);
      await this.pg.query(`INSERT INTO ${this.table} VALUES ($1)`, [migration.id]);
      callback(null);
    } catch (error) {
      callback(new MigrationError(error.message, migration));
    }
  }
}
