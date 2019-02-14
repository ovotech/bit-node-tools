import { Message } from 'kafka-node';

export class AvroDeserializerError extends Error {
  constructor(message: string, public chunk: Message, public encoding: string, public originalError?: Error) {
    super(message);
  }
}
