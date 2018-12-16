import { AvroMessage, AvroProduceRequest } from '@ovotech/avro-stream';
import { writeFileSync } from 'fs';
import { Writable } from 'stream';

export class FileWritable extends Writable {
  private requests: { [key: number]: AvroProduceRequest } = {};

  constructor(private filename: string) {
    super({ objectMode: true });
  }

  async _write(message: AvroMessage, encoding: string, callback: (error?: Error | null) => void) {
    const { schema, partition, topic, key, value } = message;
    const request = this.requests[partition!] || { topic, schema, partition, key, messages: [] };

    this.requests = {
      ...this.requests,
      [partition!]: { ...request, messages: [...request.messages, value] },
    };

    writeFileSync(this.filename, JSON.stringify(this.requests, null, 2));
    callback(null);
  }
}
