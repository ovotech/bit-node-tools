import { Logger } from '@ovotech/winston-logger';

export class BatchCalls {
  private batchData: unknown[];

  constructor(
    protected batchSendIntervalMs: number,
    private callback: (...args: any[]) => void,
    protected logger: Logger,
  ) {
    this.batchData = [];
  }

  public async addToBatch(item: unknown) {
    this.batchData.push(item);

    if (this.batchData.length >= 50) {
      const tempBatchData = [...this.batchData];
      this.flushBatchData();
      await this.executeCallbackForBatch(tempBatchData);
    }
  }

  private async executeCallbackForBatch(batchData: unknown[]) {
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
    logger.info('Instantiating new Influx Batch Calls class instance');

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
