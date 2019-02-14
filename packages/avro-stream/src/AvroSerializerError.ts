import { AvroProduceRequest } from './types';

export class AvroSerializerError extends Error {
  constructor(
    message: string,
    public chunk: AvroProduceRequest,
    public encoding: string,
    public originalError?: Error,
  ) {
    super(message);
  }
}
