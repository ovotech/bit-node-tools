import chalk from 'chalk';
import * as ProgressBar from 'progress';
import { Transform, TransformCallback } from 'stream';
import * as supportsColor from 'supports-color';
import { inspect } from 'util';
import { Progress, ProgressMessage } from '../types';

export const messageToString = (message: ProgressMessage) => {
  const current = String(message.offset);
  const max = String(message.highWaterOffset! - 1);
  const partition = String(message.partition);
  const key = String(message.key);
  const data = inspect(message.value, false, 5, Boolean(supportsColor.stdout));

  return chalk`{gray Offset} {yellow ${current}/${max}} {gray partition} {cyan ${partition}} {gray key} ${key}
${data}
{gray ----------------------------------------}`;
};

export class LogConsumerProgressTransform extends Transform {
  private progressBar?: ProgressBar;
  private progress: Progress = { total: 0, totalCount: 0, partitions: {} };

  constructor(private verbose: boolean = false) {
    super({ objectMode: true });
    if (supportsColor.stdout) {
      this.progressBar = new ProgressBar('[:bar] :percent Elapsed: :elapseds', { total: 60, width: 60 });
    }
  }

  _flush(callback: TransformCallback) {
    if (this.progressBar) {
      this.progressBar.terminate();
    }
    process.stdout.write(chalk`{green Consumed} {yellow ${String(this.progress.totalCount)}} {green messages}\n`);

    for (const [partition, item] of Object.entries(this.progress.partitions)) {
      const offset = String(item.offset + 1);
      process.stdout.write(
        chalk`{green  - Partition} {cyan ${String(partition)}} {green :} {yellow ${offset}} {green messages}\n`,
      );
    }
    callback();
  }

  _transform(message: ProgressMessage, encoding: string, callback: TransformCallback) {
    this.progress = message.progress;
    if (this.progressBar) {
      this.progressBar.update(message.progress.total);
    }

    if (this.verbose) {
      const logMessage = messageToString(message as any);
      if (this.progressBar) {
        this.progressBar.interrupt(logMessage);
      } else {
        process.stdout.write(`${logMessage}\n`);
      }
    }
    callback(undefined, message);
  }
}
