import { ConsumerGroupStream, Message } from 'kafka-node';
import { Transform, TransformCallback } from 'stream';
import { MetadataResult, PartitionProgressMap, ProgressMessage } from '../types';

export class ConsumerProgressTransform extends Transform {
  private progress: PartitionProgressMap = {};

  constructor(private consumerStream: ConsumerGroupStream) {
    super({ objectMode: true });
  }

  async loadPartitions(topic: string) {
    const result = await new Promise<MetadataResult>((resolve, reject) =>
      (this.consumerStream.consumerGroup.client as any).loadMetadataForTopics(
        [topic],
        (error: Error | null, results: MetadataResult) => (error ? reject(error) : resolve(results)),
      ),
    );
    const metadata = result[1].metadata[topic];
    return Object.keys(metadata);
  }

  async initPartionProgress(topic: string) {
    if (Object.keys(this.progress).length === 0) {
      const partitions = await this.loadPartitions(topic);
      this.progress = partitions.reduce(
        (acc, partition) => ({ ...acc, [partition]: { offset: 0, highWaterOffset: 0, progress: 0 } }),
        this.progress,
      );
    }
  }

  updateProgress(message: Message) {
    const { highWaterOffset, offset, partition } = message;
    if (highWaterOffset !== undefined && offset !== undefined && partition !== undefined) {
      this.progress[partition] = { offset, highWaterOffset, progress: offset / (highWaterOffset - 1) };
    }
  }

  totalProgress() {
    const progresses = Object.values(this.progress);
    if (!progresses.length) {
      return 0;
    }
    return progresses.reduce((sum, item) => item.progress + sum, 0) / progresses.length;
  }

  totalCount() {
    return Object.values(this.progress).reduce((sum, item) => item.offset + 1 + sum, 0);
  }

  async _transform(message: Message, encoding: string, callback: TransformCallback) {
    await this.initPartionProgress(message.topic);

    this.updateProgress(message);

    const progressMessage: ProgressMessage = {
      ...message,
      progress: { total: this.totalProgress(), totalCount: this.totalCount(), partitions: this.progress },
    };

    callback(undefined, progressMessage);
  }
}
