import { Message } from './types';

export class PGSinkError extends Error {
  constructor(message: string, public chunk: Message, public encoding: string, public originalError?: Error) {
    super(message);
  }
}
