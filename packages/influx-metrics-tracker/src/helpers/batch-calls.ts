import { Logger } from '@ovotech/winston-logger';

export class BatchCalls {
  private batchData: unknown[];

  constructor(private callback: (...args: any[]) => void) {
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
      return this.callback(batchData);
    }
  }

  private flushBatchData() {
    this.batchData = [];
  }
}

interface Instance {
  classInstance: BatchCalls;
  callback: (...args: any[]) => void;
}

const currentInstances: Instance[] = [];

export default function getBatchCallsInstance(callback: (...args: any[]) => void, logger: Logger): BatchCalls {
  let foundInstance = currentInstances.find(currentInstance => currentInstance.callback === callback);

  if (!foundInstance) {
    logger.info('Instantiating new Influx Batch Calls class instance');

    foundInstance = {
      classInstance: new BatchCalls(callback),
      callback,
    };
    currentInstances.push(foundInstance);
  }

  return foundInstance.classInstance;
}
