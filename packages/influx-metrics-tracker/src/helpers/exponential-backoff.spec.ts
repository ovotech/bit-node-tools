import * as exponentialBackoff from './exponential-backoff';

const mockFunction = jest.fn();
jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');
function setMockToThrowErrorNTimes(times: number) {
  for (let i = 0; i < times; i++) {
    mockFunction.mockImplementationOnce(() => {
      throw Error();
    });
  }
}

describe('executeCallbackOrExponentiallyBackOff', () => {
  const spy = jest.spyOn(exponentialBackoff, 'executeCallbackOrExponentiallyBackOff');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Executes a successful call once and does not retry', () => {
    exponentialBackoff.executeCallbackOrExponentiallyBackOff(mockFunction);

    expect(mockFunction).toBeCalledTimes(1);
    // expect(setTimeout).toHaveBeenCalledTimes(1);
  });
  it('Retries an unsuccessful call for a second time after 1 second', () => {
    setMockToThrowErrorNTimes(1);

    exponentialBackoff.executeCallbackOrExponentiallyBackOff(mockFunction);

    jest.runAllTimers();

    expect(mockFunction).toBeCalledTimes(2);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
  });

  it.each`
    retryTimes | numberOfSeconds
    ${1}       | ${1}
    ${2}       | ${2}
    ${3}       | ${4}
    ${4}       | ${8}
    ${10}      | ${512}
    ${40}      | ${549755813888}
  `(
    'Retries an unsuccessful call $retryTimes time(s) after $numberOfSeconds second(s)',
    ({ retryTimes, numberOfSeconds }) => {
      setMockToThrowErrorNTimes(retryTimes);

      exponentialBackoff.executeCallbackOrExponentiallyBackOff(mockFunction);

      jest.runAllTimers();

      expect(mockFunction).toBeCalledTimes(retryTimes + 1);
      expect(setTimeout).toHaveBeenCalledTimes(retryTimes);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), numberOfSeconds * 1000);
    },
  );
});
