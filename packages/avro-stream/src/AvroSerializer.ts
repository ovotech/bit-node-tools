import { TransformCallback } from 'stream';
import { AvroSchemaTransform } from './AvroSchemaTransform';
import { AvroSerializerError } from './AvroSerializerError';
import { constructMessage } from './message';
import { AvroProduceRequest } from './types';

export class AvroSerializer<TValue = any> extends AvroSchemaTransform {
  async _transform(request: AvroProduceRequest<TValue>, encoding: string, callback: TransformCallback) {
    try {
      const type = this.typeForSchema(request.schema);
      const schemaId = await this.resolver.toId(request.topic, request.schema);

      callback(undefined, {
        ...request,
        messages: request.messages.map(message => constructMessage({ schemaId, buffer: type.toBuffer(message) })),
      });
    } catch (error) {
      callback(new AvroSerializerError<TValue>(error.message, request, encoding, error));
    }
  }
}
