export default class BatchCalls {
  private batchData: unknown[];

  constructor(protected batchSendIntervalMs: number, private batchCall: Function) {
    this.batchData = [];
    this.startBatchEventLoop(batchSendIntervalMs);
  }

  private async sendBatches() {
    if (this.batchData.length > 0) {
      this.batchCall(this.batchData);
    }
  }

  private flushBatchData() {
    this.batchData = [];
  }

  public addToBatch(item: unknown) {
    this.batchData.push(item);
  }

  private startBatchEventLoop(batchSendIntervalMs: number) {
    setInterval(async () => {
      await this.sendBatches();
      this.flushBatchData();
    }, batchSendIntervalMs);
  }
}
