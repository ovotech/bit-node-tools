import { ForSchemaOptions, Schema, Type } from 'avsc';
import { Transform } from 'stream';
import { SchemaRegistryResolver } from './SchemaRegistryResolver';
import { SchemaResolver } from './types';

export abstract class AvroSchemaTransform extends Transform {
  protected resolver: SchemaResolver;

  constructor(resolver: SchemaResolver | string, private schemaOptions?: Partial<ForSchemaOptions>) {
    super({ objectMode: true });
    this.resolver = typeof resolver === 'string' ? new SchemaRegistryResolver(resolver) : resolver;
  }

  typeForSchema(schema: Schema) {
    return Type.forSchema(schema, { registry: {}, ...this.schemaOptions });
  }
}
