import * as exponentialBackoff from '../../src/helpers/exponential-backoff';

const mockFunction = jest.fn();
jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

function setMockToThrowErrorNTimes(times: number) {
  for (let i = 0; i < times; i++) {
    mockFunction.mockRejectedValueOnce('');
  }
}

describe('executeCallbackOrExponentiallyBackOff', () => {
  let mockLogger: any;

  jest.spyOn(exponentialBackoff, 'executeCallbackOrExponentiallyBackOff');

  beforeEach(() => {
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
    jest.clearAllMocks();
  });

  it('Executes a successful call once and does not retry', async () => {
    const executeFunction = exponentialBackoff.executeCallbackOrExponentiallyBackOff(mockFunction, mockLogger);
    jest.runAllTimers();
    await executeFunction;

    expect(mockFunction).toBeCalledTimes(1);
  });

  it.each`
    retryTimes | numberOfSeconds
    ${1}       | ${1}
    ${2}       | ${2}
    ${3}       | ${4}
    ${4}       | ${8}
    ${10}      | ${512}
  `(
    'Retries an unsuccessful call $retryTimes time(s) after $numberOfSeconds second(s)',
    async ({ retryTimes, numberOfSeconds }) => {
      setMockToThrowErrorNTimes(retryTimes);

      await exponentialBackoff.executeCallbackOrExponentiallyBackOff(mockFunction, mockLogger, 0, 0, jest.runAllTimers);

      expect(mockFunction).toBeCalledTimes(retryTimes + 1);
      expect(setTimeout).toHaveBeenCalledTimes(retryTimes + 1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), numberOfSeconds * 1000);
    },
  );

  it('Does not retry after 20 attempts', async () => {
    const retryTimes = 25;
    setMockToThrowErrorNTimes(retryTimes);

    await exponentialBackoff.executeCallbackOrExponentiallyBackOff(mockFunction, mockLogger, 0, 0, jest.runAllTimers);

    expect(mockFunction).toBeCalledTimes(16);
    expect(setTimeout).toHaveBeenCalledTimes(16);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 16384000);
  });
});
