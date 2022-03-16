import { Logger } from '@ovotech/winston-logger';

const ONE_SECOND = 1000;

export async function executeCallbackOrExponentiallyBackOff(
  callback: (...args: any[]) => void,
  logger: Logger,
  timer = ONE_SECOND,
): Promise<void> {
  try {
    logger.info('Executing Influx Metrics Tracker batch callback');
    await callback();
  } catch (err) {
    setTimeout(() => {
      const newTimeout = timer * 2;
      logger.error(
        `Influx Metrics Tracker callback failed. Exponentially backing off and trying again in ${newTimeout /
          1000} seconds`,
      );

      executeCallbackOrExponentiallyBackOff(callback, logger, newTimeout);
    }, timer);
  }
}
