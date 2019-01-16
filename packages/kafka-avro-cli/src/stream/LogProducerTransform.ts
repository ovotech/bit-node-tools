import { AvroProduceRequest } from '@ovotech/avro-stream';
import chalk from 'chalk';
import { Transform, TransformCallback } from 'stream';

export class LogProducerTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _flush(callback: TransformCallback) {
    process.stdout.write(chalk`{green Finished}\n`);
    callback();
  }

  _transform(request: AvroProduceRequest, encoding: string, callback: TransformCallback) {
    const count = String(request.messages.length);
    const partition = String(request.partition);

    process.stdout.write(
      chalk`{gray Produce} ${count} {gray messages in} ${partition} {gray partition, for} ${
        request.topic
      } {gray topic}\n`,
    );

    callback(undefined, request);
  }
}
