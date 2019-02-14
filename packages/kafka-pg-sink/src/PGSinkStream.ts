import { Client } from 'pg';
import { Writable } from 'stream';
import { PGSinkError, PGSinkMultipleError } from './';
import { Message } from './types';

export type PGSinkResolver = (message: Message) => any[];

export interface PGSinkConfig {
  table: string;
  resolver: PGSinkResolver;
}

export interface PGSinkStreamOptions {
  pg: Client;
  topics: { [topic: string]: PGSinkConfig };
  highWaterMark?: number;
}

export interface GroupedChunks {
  [topic: string]: Message[];
}

export const groupChunks = (chunks: Array<{ chunk: Message; encoding: string }>): GroupedChunks => {
  return chunks.reduce(
    (acc, current) => ({
      ...acc,
      [current.chunk.topic]: [...(acc[current.chunk.topic] || []), current.chunk],
    }),
    {} as GroupedChunks,
  );
};

export const insertQuery = (table: string, valuesMap: any[][]): [string, any[]] => {
  const query = valuesMap
    .map((values, rowIndex) => `(${values.map((_, index) => `$${index + 1 + rowIndex * values.length}`).join(',')})`)
    .join(',');
  const flatValues = valuesMap.reduce((all, item) => [...all, ...item], [] as any[]);

  return [`INSERT INTO ${table} VALUES ${query} ON CONFLICT DO NOTHING`, flatValues];
};

export class PGSinkStream extends Writable {
  private pg: Client;
  private topics: PGSinkStreamOptions['topics'];

  constructor({ pg, topics, highWaterMark = 200 }: PGSinkStreamOptions) {
    super({ objectMode: true, highWaterMark });
    this.pg = pg;
    this.topics = topics;
  }

  configForTopic(topic: string) {
    const config = this.topics[topic];
    if (!config) {
      throw new Error(
        `Config not found for topic "${topic}", you'll need to add it in the options for PGSinkStream constructor`,
      );
    }
    return config;
  }

  async _write(chunk: Message, encoding: string, callback: (error?: Error | null) => void) {
    try {
      const config = this.configForTopic(chunk.topic);
      await this.pg.query(...insertQuery(config.table, [config.resolver(chunk)]));
      callback(null);
    } catch (error) {
      callback(new PGSinkError(error.message, chunk, encoding, error));
    }
  }

  async _writev?(chunks: Array<{ chunk: Message; encoding: string }>, callback: (error?: Error | null) => void) {
    try {
      const topics = groupChunks(chunks);

      for (const topic of Object.keys(topics)) {
        const config = this.configForTopic(topic);
        await this.pg.query(...insertQuery(config.table, topics[topic].map(config.resolver)));
      }

      callback(null);
    } catch (error) {
      callback(new PGSinkMultipleError(error.message, chunks, error));
    }
  }
}
