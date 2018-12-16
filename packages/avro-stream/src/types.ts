import { Schema } from 'avsc';
import { Message, ProduceRequest } from 'kafka-node';

export interface SchemaResolver {
  toId(topic: string, schema: Schema): Promise<number>;
  fromId(id: number): Promise<Schema>;
}

export interface AvroProduceRequest extends ProduceRequest {
  schema: Schema;
  messages: any[];
}

export interface AvroMessage extends Message {
  schema: Schema;
  value: any;
}
