import { Message } from 'kafka-node';
import { TransformCallback } from 'stream';
import { AvroSchemaTransform } from './AvroSchemaTransform';
import { deconstructMessage } from './message';
import { AvroMessage } from './types';

export class AvroDeserializer extends AvroSchemaTransform {
  async _transform(message: Message, encoding: string, callback: TransformCallback) {
    try {
      if (typeof message.value === 'string') {
        throw new Error(`ConsumerGroupStream for topic "${message.topic}" must set the encoding to "buffer"`);
      }

      const { schemaId, buffer } = deconstructMessage(message.value);
      const schema = await this.resolver.fromId(schemaId);
      const type = this.typeForSchema(schema);
      const transformedMessage: AvroMessage = { ...message, schema, value: type.fromBuffer(buffer) };
      callback(undefined, transformedMessage);
    } catch (error) {
      callback(error);
    }
  }
}
