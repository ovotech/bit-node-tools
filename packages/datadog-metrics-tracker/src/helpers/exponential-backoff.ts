import { Logger } from '@ovotech/winston-logger';

const ONE_SECOND = 1000;
const MAX_NUMBER_OF_ATTEMPTS = 15;

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
  currentNumberOfAttempts = 0,
  dependencyInjectionRunAllTimers = () => {},
): Promise<void> {
  try {
    logger.info('Executing DataDog Metrics Tracker batch callback');

    const sleepTimer = sleep(timer);
    dependencyInjectionRunAllTimers();
    await sleepTimer;

    await callback();
    logger.info('Completed DataDog Metrics Tracker batch callback');
  } catch (err) {
    if (currentNumberOfAttempts >= MAX_NUMBER_OF_ATTEMPTS) {
      logger.error(
        `Too many failed attempts. No longer backing off. DataDog Metrics Tracker callback failed after ${currentNumberOfAttempts} attempts. Error: ${err}`,
      );
    } else {
      const newTimeout = timer ? timer * 2 : ONE_SECOND;
      logger.error(
        `DataDog Metrics Tracker callback failed. Exponentially backing off and trying again in ${newTimeout /
          1000} seconds ${err}`,
        { attemptNumber: currentNumberOfAttempts },
      );
      return executeCallbackOrExponentiallyBackOff(
        callback,
        logger,
        newTimeout,
        currentNumberOfAttempts + 1,
        dependencyInjectionRunAllTimers,
      );
    }
  }
}
