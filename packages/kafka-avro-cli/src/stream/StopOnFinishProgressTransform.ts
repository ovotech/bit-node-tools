import { ConsumerGroupStream } from 'kafka-node';
import { Transform, TransformCallback } from 'stream';
import { ProgressMessage } from '../types';

export class StopOnFinishProgressTransform extends Transform {
  constructor(private consumerStream: ConsumerGroupStream, private active: boolean = true) {
    super({ objectMode: true });
  }

  async _transform(message: ProgressMessage, encoding: BufferEncoding, callback: TransformCallback) {
    this.push(message, encoding);

    if (this.active && message.progress.total >= 1) {
      this.consumerStream.close(() => {
        this.push(null);
        callback();
      });
    } else {
      callback();
    }
  }
}
