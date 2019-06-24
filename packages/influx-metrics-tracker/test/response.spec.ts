import { ResponseMetricsTracker } from '../src/response';

describe('Track actions relating to responding to an API request', () => {
  let mockInflux: any;
  let mockLogger: any;
  let tracker: ResponseMetricsTracker;

  beforeEach(() => {
    mockInflux = { writePoints: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { error: jest.fn(), warn: jest.fn() };
    tracker = new ResponseMetricsTracker(mockInflux, mockLogger);
  });

  it('Should track a response time without a status code', async () => {
    const requestName = 'test-request';
    const timeMs = 1234;

    await tracker.trackOwnResponseTime(requestName, timeMs);

    expect(mockInflux.writePoints).toHaveBeenLastCalledWith([
      {
        measurement: 'own-response-time',
        tags: {
          requestName,
        },
        fields: {
          count: 1,
          timeMs: 1234,
        },
      },
    ]);
  });

  it.each([200, 404, 500])('Should track a response time with a status code: %d', async statusCode => {
    const requestName = 'test-request';
    const timeMs = 123;

    await tracker.trackOwnResponseTime(requestName, timeMs, statusCode);

    expect(mockInflux.writePoints).toHaveBeenLastCalledWith([
      {
        measurement: 'own-response-time',
        tags: {
          requestName,
          status: statusCode.toString(10),
        },
        fields: {
          count: 1,
          timeMs: 123,
        },
      },
    ]);
  });
});
