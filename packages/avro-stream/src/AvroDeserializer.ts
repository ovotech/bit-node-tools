import { ForSchemaOptions, Type } from 'avsc';
import { Message } from 'kafka-node';
import { Transform, TransformCallback } from 'stream';
import { deconstructMessage } from './message';
import { SchemaRegistryResolver } from './SchemaRegistryResolver';
import { AvroMessage, SchemaResolver } from './types';

export class AvroDeserializer extends Transform {
  private resolver: SchemaResolver;

  constructor(resolver: SchemaResolver | string, private schemaOptions?: Partial<ForSchemaOptions>) {
    super({ objectMode: true });
    this.resolver = typeof resolver === 'string' ? new SchemaRegistryResolver(resolver) : resolver;
  }

  async _transform(message: Message, encoding: string, callback: TransformCallback) {
    try {
      if (typeof message.value === 'string') {
        throw new Error(`ConsumerGroupStream for topic "${message.topic}" must set the encoding to "buffer"`);
      }

      const { schemaId, buffer } = deconstructMessage(message.value);
      const schema = await this.resolver.fromId(schemaId);
      const type = Type.forSchema(schema, this.schemaOptions);
      const transformedMessage: AvroMessage = { ...message, schema, value: type.fromBuffer(buffer) };
      callback(undefined, transformedMessage);
    } catch (error) {
      callback(error);
    }
  }
}
