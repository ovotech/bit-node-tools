import { ResponseMetricsTracker } from '../src/response';

describe('Track actions relating to responding to an API request', () => {
  let mockDatadog: any;
  let mockBatchCalls: any;
  let mockLogger: any;
  let tracker: ResponseMetricsTracker;

  beforeEach(() => {
    mockDatadog = { writePoints: jest.fn().mockResolvedValue(undefined) };
    mockBatchCalls = { addToBatch: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
    tracker = new ResponseMetricsTracker(mockDatadog, mockLogger, mockBatchCalls);
  });

  it('Should track a response time without a status code', async () => {
    const requestName = 'test-request';
    const timeMs = 1234;

    await tracker.trackOwnResponseTime(requestName, timeMs);

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurement: 'own-response-time',
      tags: {
        requestName,
      },
      fields: {
        count: 1,
        timeMs: 1234,
      },
    });
  });

  it.each([200, 404, 500])('Should track a response time with a status code: %d', async statusCode => {
    const requestName = 'test-request';
    const timeMs = 123;

    await tracker.trackOwnResponseTime(requestName, timeMs, statusCode);

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurement: 'own-response-time',
      tags: {
        requestName,
        status: statusCode.toString(10),
      },
      fields: {
        count: 1,
        timeMs: 123,
      },
    });
  });

  it.each([
    [1234.5, 1235],
    [123.4, 123],
    [10, 10],
  ])('Should round response times to the nearest millisecond: %d', async (exactTime, expectedTrackedTime) => {
    const requestName = 'test-request';

    await tracker.trackOwnResponseTime(requestName, exactTime);

    expect(mockBatchCalls.addToBatch).toHaveBeenLastCalledWith({
      measurement: 'own-response-time',
      tags: {
        requestName,
      },
      fields: {
        count: 1,
        timeMs: expectedTrackedTime,
      },
    });
  });
});
