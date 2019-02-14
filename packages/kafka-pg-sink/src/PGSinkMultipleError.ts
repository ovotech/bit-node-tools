import { Message } from './types';

export class PGSinkMultipleError<TValue = any> extends Error {
  constructor(
    message: string,
    public chunks: Array<{ chunk: Message<TValue>; encoding: string }>,
    public originalError?: Error,
  ) {
    super(message);
  }
}
