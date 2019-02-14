import { Message } from './types';

export class PGSinkError<TValue = any> extends Error {
  constructor(message: string, public chunk: Message<TValue>, public encoding: string, public originalError?: Error) {
    super(message);
  }
}
