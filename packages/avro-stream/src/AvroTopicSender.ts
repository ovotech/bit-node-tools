import { Readable } from 'stream';
import { AvroProduceRequest, AvroTopicSenderOptions } from './types';

export class AvroTopicSender<TMessage = any> extends Readable {
  constructor(readonly options: AvroTopicSenderOptions) {
    super({ objectMode: true });
  }

  send(...messages: TMessage[]) {
    const produceRequest: AvroProduceRequest<TMessage> = { ...this.options, messages };
    this.push(produceRequest);
    return this;
  }

  close() {
    this.push(null);
    return this;
  }
}
