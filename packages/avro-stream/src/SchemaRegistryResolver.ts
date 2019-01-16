import { idToSchema, schemaToId, toSubject } from '@ovotech/schema-registry-api';
import { Schema } from 'avsc';
import { SchemaResolver } from './types';

export class SchemaRegistryResolver implements SchemaResolver {
  constructor(private schemaRegistryUrl: string, private cache: { [key: number]: Schema } = {}) {}

  async toId(topic: string, schema: Schema) {
    return await schemaToId(this.schemaRegistryUrl, toSubject(topic), schema);
  }

  async fromId(id: number) {
    if (!this.cache[id]) {
      this.cache[id] = await idToSchema(this.schemaRegistryUrl, id);
    }
    return this.cache[id];
  }
}
