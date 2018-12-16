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
    console.log(chalk.green('Consumed'), chalk.yellow(String(this.progress.totalCount)), chalk.green('messages'));

    for (const [partition, item] of Object.entries(this.progress.partitions)) {
      console.log(
        chalk.green(' - Partition'),
        chalk.cyan(String(partition)),
        chalk.green(':'),
        chalk.yellow(String(item.offset + 1)),
        chalk.green('messages.'),
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
        console.log(logMessage);
      }
    }
    callback(undefined, message);
  }
}
