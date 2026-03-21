import { Message } from 'kafka-node';
import { TransformCallback } from 'stream';
import { AvroSchemaTransform } from './AvroSchemaTransform';
import { AvroSerializerError } from './AvroSerializerError';
import { constructMessage } from './message';
import { AvroProduceRequest } from './types';

export class MockAvroSerializer<TValue = any> extends AvroSchemaTransform {
  async _transform(request: AvroProduceRequest<TValue>, encoding: string, callback: TransformCallback) {
    try {
      const type = this.typeForSchema(request.schema);
      const schemaId = await this.resolver.toId(request.topic, request.schema);
      const messages: Message[] = request.messages.map(message => ({
        partition: request.partition,
        key: request.key,
        topic: request.topic,
        value: constructMessage({ schemaId, buffer: type.toBuffer(message) }),
      }));

      messages.forEach(message => this.push(message));

      callback();
    } catch (error: any) {
      callback(new AvroSerializerError<TValue>(error.message, request, encoding, error));
    }
  }
}
