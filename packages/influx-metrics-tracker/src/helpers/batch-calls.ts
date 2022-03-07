import { Logger } from '@ovotech/winston-logger';

export default class BatchCalls {
  private batchData: unknown[];

  constructor(
    protected batchSendIntervalMs: number,
    private batchCall: (...args: any[]) => void,
    protected logger: Logger,
  ) {
    this.batchData = [];
    this.startBatchEventLoop(batchSendIntervalMs);
  }

  public addToBatch(item: unknown) {
    this.batchData.push(item);
  }

  private async sendBatches() {
    if (this.batchData.length > 0) {
      try {
        return this.batchCall(this.batchData);
      } catch (error) {
        this.logger.error('Error sending batch call to external service', {
          error: error && error.message ? error.message : 'Unknown error',
        });
      }
    }
  }

  private flushBatchData() {
    this.batchData = [];
  }

  private startBatchEventLoop(batchSendIntervalMs: number) {
    setInterval(async () => {
      await this.sendBatches();
      this.flushBatchData();
    }, batchSendIntervalMs);
  }
}
