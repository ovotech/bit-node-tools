import { Writable } from 'stream';

export class NullWritable extends Writable {
  constructor() {
    super({ objectMode: true });
  }

  _write(message: any, encoding: string, callback: (error?: Error | null) => void) {
    callback();
  }
}
