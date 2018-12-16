import { AvroProduceRequest } from '@ovotech/avro-stream';
import chalk from 'chalk';
import { Transform, TransformCallback } from 'stream';

export class LogProducerTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _flush(callback: TransformCallback) {
    console.log(chalk.green('Finished'));
    callback();
  }

  _transform(request: AvroProduceRequest, encoding: string, callback: TransformCallback) {
    console.log(
      chalk.gray('Produce'),
      request.messages.length,
      chalk.gray('messages in'),
      request.partition,
      chalk.gray('partition, for'),
      request.topic,
      chalk.gray('topic'),
    );

    callback(undefined, request);
  }
}
