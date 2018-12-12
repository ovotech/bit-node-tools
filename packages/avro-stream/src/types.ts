import { Schema } from 'avsc';

export interface SchemaResolver {
  toId(topic: string, schema: Schema): Promise<number>;
  fromId(id: number): Promise<Schema>;
}
