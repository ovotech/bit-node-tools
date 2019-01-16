import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ClientBase } from 'pg';
import { Readable } from 'stream';
import { Migration } from './types';

export const nameParts = (name: string) => name.split('_', 2);

export class MigrationsReadable extends Readable {
  private current: number = 0;
  private migrationFiles?: string[];

  constructor(private pg: ClientBase, private table: string, private dir: string) {
    super({ objectMode: true });
  }

  async initialize() {
    const migrationFiles = readdirSync(this.dir).filter(file => file.endsWith('.pgsql'));
    await this.initState();
    const completed = await this.loadState();

    this.migrationFiles = migrationFiles.filter(file => !completed.includes(nameParts(file)[0]));
  }

  async next() {
    if (!this.migrationFiles) {
      await this.initialize();
    }

    if (this.migrationFiles && this.migrationFiles[this.current]) {
      const file = this.migrationFiles[this.current++];
      const [id, name] = nameParts(file);
      const content = readFileSync(join(this.dir, file)).toString();
      return { id, name, content } as Migration;
    } else {
      return null;
    }
  }

  async _read() {
    this.push(await this.next());
  }

  private async initState() {
    return await this.pg.query(`CREATE TABLE IF NOT EXISTS ${this.table} (id VARCHAR PRIMARY KEY)`);
  }

  private async loadState() {
    return (await this.pg.query(`SELECT id FROM ${this.table}`)).rows.map(row => row.id);
  }
}
