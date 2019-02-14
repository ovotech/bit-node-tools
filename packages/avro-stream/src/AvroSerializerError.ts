import { AvroProduceRequest } from './types';

export class AvroSerializerError<TValue = any> extends Error {
  constructor(
    message: string,
    public chunk: AvroProduceRequest<TValue>,
    public encoding: string,
    public originalError?: Error,
  ) {
    super(message);
  }
}
