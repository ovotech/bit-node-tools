import BatchCalls from './batch-calls';

let mockFunction = jest.fn();
jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('BatchCalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFunction = jest.fn();
  });

  it('Calls the given function with a single item of batch data after the given period of time', () => {
    const batchCalls = new BatchCalls(1000, mockFunction);
    batchCalls.addToBatch({ data: 'its here yesss' });
    jest.runTimersToTime(1000);

    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toBeCalledWith([{ data: 'its here yesss' }]);
  });

  it('Calls the given function with multiple items of batch data after the given period of time', () => {
    const batchCalls = new BatchCalls(2000, mockFunction);
    batchCalls.addToBatch({ data: 'its here yesss' });
    batchCalls.addToBatch({ data: 'its also here yesss' });

    jest.runTimersToTime(2000);
    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toBeCalledWith([{ data: 'its here yesss' }, { data: 'its also here yesss' }]);
  });

  it('Does not call the given function before the time has elapsed', () => {
    const batchCalls = new BatchCalls(1000, mockFunction);
    batchCalls.addToBatch({ data: 'its here yesss' });
    jest.runTimersToTime(900);

    expect(mockFunction).not.toBeCalled();
  });

  it('Does not call the given function if the batch has no data in it', () => {
    new BatchCalls(1000, mockFunction);
    jest.runTimersToTime(1000);

    expect(mockFunction).not.toBeCalled();
  });

  it('Calls the given function with a second set of batch data after the initial time has elapsed', async () => {
    const batchCalls = new BatchCalls(2000, mockFunction);
    batchCalls.addToBatch({ data: 'its here yesss' });
    await jest.runTimersToTime(2000);

    batchCalls.addToBatch({ data: 'its also here yesss' });
    await jest.runTimersToTime(2000);

    expect(mockFunction).toBeCalledTimes(2);
    expect(mockFunction).toHaveBeenNthCalledWith(1, [{ data: 'its here yesss' }]);
    expect(mockFunction).toHaveBeenNthCalledWith(2, [{ data: 'its also here yesss' }]);
  });

  it('Does not call the given function a second time after all data is erased and no new data is added', async () => {
    const batchCalls = new BatchCalls(2000, mockFunction);
    batchCalls.addToBatch({ data: 'its here yesss' });
    await jest.runTimersToTime(2000);

    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith([{ data: 'its here yesss' }]);

    mockFunction = jest.fn();
    await jest.runTimersToTime(2000);

    expect(mockFunction).not.toBeCalled();
  });
});
