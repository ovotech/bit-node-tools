import { TransformCallback } from 'stream';
import { AvroSchemaTransform } from './AvroSchemaTransform';
import { constructMessage } from './message';
import { AvroProduceRequest } from './types';

export class AvroSerializer extends AvroSchemaTransform {
  async _transform(request: AvroProduceRequest, encoding: string, callback: TransformCallback) {
    try {
      const type = this.typeForSchema(request.schema);
      const schemaId = await this.resolver.toId(request.topic, request.schema);

      callback(undefined, {
        ...request,
        messages: request.messages.map(message => constructMessage({ schemaId, buffer: type.toBuffer(message) })),
      });
    } catch (error) {
      callback(error);
    }
  }
}
