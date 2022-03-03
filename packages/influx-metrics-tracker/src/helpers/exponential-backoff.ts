const ONE_SECOND = 1000;

export function executeCallbackOrExponentiallyBackOff(callback: Function, timer = ONE_SECOND) {
  try {
    callback();
  } catch (err) {
    setTimeout(() => {
      executeCallbackOrExponentiallyBackOff(callback, timer * 2);
    }, timer);
  }
}
