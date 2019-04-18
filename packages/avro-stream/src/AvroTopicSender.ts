import { Readable, ReadableOptions } from 'stream';
import { AvroProduceRequest, AvroTopicSenderOptions } from './types';

export class AvroTopicSender<TMessage = any> extends Readable {
  readonly options: AvroTopicSenderOptions;

  constructor(options: AvroTopicSenderOptions & ReadableOptions) {
    const { schema, topic, partition, key, ...readableOptions } = options;
    super({ ...readableOptions, objectMode: true });
    this.options = { schema, topic, partition, key };
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
