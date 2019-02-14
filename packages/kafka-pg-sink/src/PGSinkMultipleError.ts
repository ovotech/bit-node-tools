import { Message } from './types';

export class PGSinkMultipleError extends Error {
  constructor(
    message: string,
    public chunks: Array<{ chunk: Message; encoding: string }>,
    public originalError?: Error,
  ) {
    super(message);
  }
}
