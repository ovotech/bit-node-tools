import { AvroProduceRequest } from '@ovotech/avro-stream/dist/types';
import { readFileSync } from 'fs';
import { Readable } from 'stream';

export class FileReadable extends Readable {
  private partition: number = 0;
  private requests: { [partition: number]: AvroProduceRequest } | undefined;

  constructor(private file: string) {
    super({ objectMode: true });
  }

  next() {
    if (!this.requests) {
      this.requests = JSON.parse(String(readFileSync(this.file)));
    }

    if (this.requests && this.requests[this.partition]) {
      return this.requests[this.partition++];
    } else {
      return null;
    }
  }

  _read() {
    this.push(this.next());
  }
}
