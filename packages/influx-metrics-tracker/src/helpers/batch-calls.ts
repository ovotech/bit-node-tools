import { Logger } from '@ovotech/winston-logger';

class BatchCalls {
  private batchData: unknown[];

  constructor(
    protected batchSendIntervalMs: number,
    private callback: (...args: any[]) => void,
    protected logger: Logger,
  ) {
    this.batchData = [];
    this.startBatchEventLoop(batchSendIntervalMs);
  }

  public addToBatch(item: unknown) {
    this.batchData.push(item);
  }

  private async sendBatches(batchData: unknown[]) {
    if (batchData.length > 0) {
      try {
        return this.callback(batchData);
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
      const tempBatchData = [...this.batchData];
      this.flushBatchData();
      await this.sendBatches(tempBatchData);
    }, batchSendIntervalMs);
  }
}

interface Instance {
  classInstance: BatchCalls;
  batchSendIntervalMs: number;
  callback: (...args: any[]) => void;
  logger: Logger;
}

const currentInstances: Instance[] = [];

export default function getBatchCallsInstance(
  batchSendIntervalMs: number,
  callback: (...args: any[]) => void,
  logger: Logger,
): BatchCalls {
  let foundInstance = currentInstances.find(
    currentInstance =>
      currentInstance.batchSendIntervalMs === batchSendIntervalMs &&
      currentInstance.callback === callback &&
      currentInstance.logger === logger,
  );

  if (!foundInstance) {
    foundInstance = {
      classInstance: new BatchCalls(batchSendIntervalMs, callback, logger),
      batchSendIntervalMs,
      callback,
      logger,
    };
    currentInstances.push(foundInstance);
  }

  return foundInstance.classInstance;
}
