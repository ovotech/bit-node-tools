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
  timer = 0,
  di_runAllTimers = () => {},
): Promise<void> {
  try {
    const sleepTimer = sleep(timer);
    di_runAllTimers();
    await sleepTimer;
    await callback();
  } catch (err) {
    const newTimeout = timer ? timer * 2 : ONE_SECOND;
    return executeCallbackOrExponentiallyBackOff(callback, newTimeout, di_runAllTimers);
  }
}
