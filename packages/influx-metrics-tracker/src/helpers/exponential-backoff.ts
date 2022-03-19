import { Logger } from '@ovotech/winston-logger';

const ONE_SECOND = 1000;

function sleep(sleepTimeMs: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({});
    }, sleepTimeMs);
  });
}

export async function executeCallbackOrExponentiallyBackOff(
  callback: (...args: any[]) => void,
  logger: Logger,
  timer = 0,
  di_runAllTimers = () => {},
): Promise<void> {
  try {
    logger.info('Executing Influx Metrics Tracker batch callback');
    logger.info(`Sleeping for ${timer / 1000} seconds`);

    const sleepTimer = sleep(timer);
    di_runAllTimers();
    await sleepTimer;

    logger.info(`Completed sleeping for ${timer / 1000} seconds`);
    await callback();
    logger.info('Completed Influx Metrics Tracker batch callback');
  } catch (err) {
    logger.error(`Influx Metrics Tracker callback failed. Attempt: ${timer} Error: ${err}`);
    const newTimeout = timer ? timer * 2 : ONE_SECOND;
    logger.error(
      `Influx Metrics Tracker callback failed. Exponentially backing off and trying again in ${newTimeout /
        1000} seconds ${err}`,
    );
    return executeCallbackOrExponentiallyBackOff(callback, logger, newTimeout, di_runAllTimers);
  }
}
