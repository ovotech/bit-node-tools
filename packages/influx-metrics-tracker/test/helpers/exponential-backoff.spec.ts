import * as exponentialBackoff from '../../src/helpers/exponential-backoff';

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
  let mockLogger: any;

  const spy = jest.spyOn(exponentialBackoff, 'executeCallbackOrExponentiallyBackOff');

  beforeEach(() => {
    mockLogger = { error: jest.fn(), warn: jest.fn() };
    jest.clearAllMocks();
  });

  it('Executes a successful call once and does not retry', () => {
    exponentialBackoff.executeCallbackOrExponentiallyBackOff(mockFunction, mockLogger);

    expect(mockFunction).toBeCalledTimes(1);
    expect(setTimeout).not.toBeCalled();
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

      exponentialBackoff.executeCallbackOrExponentiallyBackOff(mockFunction, mockLogger);

      jest.runAllTimers();

      expect(mockFunction).toBeCalledTimes(retryTimes + 1);
      expect(setTimeout).toHaveBeenCalledTimes(retryTimes);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), numberOfSeconds * 1000);
    },
  );
});
