const BATCH_SIZE_LIMIT = 50;
const ONE_MINUTE = 60000;
let BATCH_TIMER: any;
export class BatchManagement {
  private _batchData: unknown[];

  constructor() {
    this._batchData = [];
  }

  public addToBatch(item: unknown) {
    this._batchData.push(item);
  }

  public flushBatchData() {
    this._batchData = [];
  }

  public isBatchFull() {
    return this._batchData.length >= BATCH_SIZE_LIMIT;
  }

  public get batchData() {
    return this._batchData;
  }
}

let batchManagement: BatchManagement;

function getBatchManagementInstance() {
  if (!batchManagement) {
    batchManagement = new BatchManagement();
  }

  return batchManagement;
}

export default class BatchCalls {
  constructor(
    private callback: (...args: any[]) => void,
    private batchManagement: BatchManagement = getBatchManagementInstance(),
  ) {}
  triggerTimer() {
    clearTimeout(BATCH_TIMER);
    BATCH_TIMER = setTimeout(() => {
      this.executeCallbackForBatch(this.batchManagement.batchData);
      this.batchManagement.flushBatchData();
      this.clearTimer();
    }, ONE_MINUTE);
  }
  clearTimer() {
    clearTimeout(BATCH_TIMER);
    BATCH_TIMER = null;
  }
  public async addToBatch(item: unknown) {
    this.batchManagement.addToBatch(item);

    if (this.batchManagement.isBatchFull()) {
      this.clearTimer();
      const tempBatchData = [...this.batchManagement.batchData];
      this.batchManagement.flushBatchData();
      await this.executeCallbackForBatch(tempBatchData);
    } else {
      this.triggerTimer();
    }
  }

  private async executeCallbackForBatch(batchData: unknown[]) {
    if (batchData.length > 0) {
      return this.callback(batchData);
    }
  }
}
