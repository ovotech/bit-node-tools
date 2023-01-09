import { ResponseMetricsTracker } from '../src/response';

describe('Track actions relating to responding to an API request', () => {
  let mockDatadog: any;
  let mockLogger: any;
  let tracker: ResponseMetricsTracker;

  beforeEach(() => {
    mockDatadog = { distribution: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
    tracker = new ResponseMetricsTracker(mockDatadog, mockLogger, {});
  });

  it('Should track a response time without a status code', async () => {
    const requestName = 'test-request';
    const timeMs = 1234;

    await tracker.trackOwnResponseTime(requestName, timeMs);
    const data = {
      requestName,
      count: 1,
      timeMs,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith('own-response-time',timeMs, data);
  });

  it.each([200, 404, 500])('Should track a response time with a status code: %d', async statusCode => {
    const requestName = 'test-request';
    const timeMs = 123;

    await tracker.trackOwnResponseTime(requestName, timeMs, statusCode);
    const data = {
      requestName,
      status: statusCode.toString(10),
      count: 1,
      timeMs,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith('own-response-time',timeMs, data);
  });

  it.each([
    [1234.5, 1235],
    [123.4, 123],
    [10, 10],
  ])('Should round response times to the nearest millisecond: %d', async (exactTime, expectedTrackedTime) => {
    const requestName = 'test-request';

    await tracker.trackOwnResponseTime(requestName, exactTime);
    const data = {
      requestName,
      count: 1,
      timeMs: expectedTrackedTime,
    };
    expect(mockDatadog.distribution).toHaveBeenLastCalledWith('own-response-time',expectedTrackedTime, data);
  });
});
