import BatchCalls from '../../src/helpers/batch-calls';

let mockFunction = jest.fn();
jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('BatchCalls', () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFunction = jest.fn();
  });

  it('Calls the given function with a single item of batch data after the given period of time', () => {
    const batchCalls = new BatchCalls(1000, mockFunction, mockLogger);
    batchCalls.addToBatch({ data: 'its here yesss' });
    jest.runTimersToTime(1000);

    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toBeCalledWith([{ data: 'its here yesss' }]);
  });

  it('Calls the given function with multiple items of batch data after the given period of time', () => {
    const batchCalls = new BatchCalls(2000, mockFunction, mockLogger);
    batchCalls.addToBatch({ data: 'its here yesss' });
    batchCalls.addToBatch({ data: 'its also here yesss' });

    jest.runTimersToTime(2000);
    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toBeCalledWith([{ data: 'its here yesss' }, { data: 'its also here yesss' }]);
  });

  it('Does not call the given function before the time has elapsed', () => {
    const batchCalls = new BatchCalls(1000, mockFunction, mockLogger);
    batchCalls.addToBatch({ data: 'its here yesss' });
    jest.runTimersToTime(900);

    expect(mockFunction).not.toBeCalled();
  });

  it('Does not call the given function if the batch has no data in it', () => {
    const _ = new BatchCalls(1000, mockFunction, mockLogger);
    jest.runTimersToTime(1000);

    expect(mockFunction).not.toBeCalled();
  });

  it('Calls the given function with a second set of batch data after the initial time has elapsed', async () => {
    const batchCalls = new BatchCalls(2000, mockFunction, mockLogger);
    batchCalls.addToBatch({ data: 'its here yesss' });
    await jest.runTimersToTime(2000);

    batchCalls.addToBatch({ data: 'its also here yesss' });
    await jest.runTimersToTime(3000);

    expect(mockFunction).toBeCalledTimes(2);
    expect(mockFunction).toHaveBeenNthCalledWith(1, [{ data: 'its here yesss' }]);
    expect(mockFunction).toHaveBeenNthCalledWith(2, [{ data: 'its also here yesss' }]);
  });

  it('Does not call the given function a second time after all data is erased and no new data is added', async () => {
    const batchCalls = new BatchCalls(2000, mockFunction, mockLogger);
    batchCalls.addToBatch({ data: 'its here yesss' });
    await jest.runTimersToTime(2000);

    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith([{ data: 'its here yesss' }]);

    mockFunction = jest.fn();
    await jest.runTimersToTime(2000);

    expect(mockFunction).not.toBeCalled();
  });

  it('Logs the error message if the call to the external service fails', async () => {
    const batchCalls = new BatchCalls(
      2000,
      () => {
        throw new Error('IT BROKE');
      },
      mockLogger,
    );
    batchCalls.addToBatch({ data: 'its here yesss' });

    await jest.runTimersToTime(2000);

    expect(mockLogger.error).toBeCalledWith('Error sending batch call to external service', {
      error: 'IT BROKE',
    });
  });
});
