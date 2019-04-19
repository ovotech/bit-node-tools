import { Schema } from 'avsc';
import { Message, ProduceRequest } from 'kafka-node';

export interface SchemaResolver {
  toId(topic: string, schema: Schema): Promise<number>;
  fromId(id: number): Promise<Schema>;
}

export interface AvroTopicSenderOptions {
  schema: Schema;
  topic: string;
  partition: number;
  key?: string | Buffer;
}

export interface AvroProduceRequest<TValue = any> extends ProduceRequest {
  schema: Schema;
  messages: TValue[];
}

export interface AvroMessage extends Message {
  schema: Schema;
  value: any;
}
