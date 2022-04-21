import BatchCalls, { BatchManagement } from '../../src/helpers/batch-calls';

let mockFunction = jest.fn();
jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('BatchCalls', () => {
  let batchManagement: BatchManagement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFunction = jest.fn();
    batchManagement = new BatchManagement();
  });

  it('Calls the given function when 50 items are in the batch', () => {
    const batchCalls = new BatchCalls(mockFunction, batchManagement);
    let expected = [];

    for (let i = 0; i < 50; i++) {
      batchCalls.addToBatch({ data: 'its here yesss' });
      expected.push({ data: 'its here yesss' });
    }

    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toBeCalledWith(expected);
  });

  it('Calls the given function twice when 100 identical items are in the batch', () => {
    const batchCalls = new BatchCalls(mockFunction, batchManagement);
    let expected = [];

    for (let i = 0; i < 100; i++) {
      batchCalls.addToBatch({ data: 'its here yesss' });
    }
    for (let i = 0; i < 50; i++) {
      expected.push({ data: 'its here yesss' });
    }

    expect(mockFunction).toBeCalledTimes(2);
    expect(mockFunction).toHaveBeenNthCalledWith(1, expected);
    expect(mockFunction).toHaveBeenNthCalledWith(2, expected);
  });

  it('Calls the given function twice when 100 different items are in the batch', () => {
    const batchCalls = new BatchCalls(mockFunction, batchManagement);
    let firstExpectedResult = [];
    let secondExpectedResult = [];

    for (let i = 0; i < 100; i++) {
      batchCalls.addToBatch({ data: `its here yesss ${i}` });
    }
    for (let i = 0; i < 50; i++) {
      firstExpectedResult.push({ data: `its here yesss ${i}` });
      secondExpectedResult.push({ data: `its here yesss ${i + 50}` });
    }

    expect(mockFunction).toBeCalledTimes(2);
    expect(mockFunction).toHaveBeenNthCalledWith(1, firstExpectedResult);
    expect(mockFunction).toHaveBeenNthCalledWith(2, secondExpectedResult);
  });

  it('Calls the given function once with 50 items when there is more than 50 items but less than 100 items in the batch', () => {
    const batchCalls = new BatchCalls(mockFunction, batchManagement);
    let expected = [];

    for (let i = 0; i < 67; i++) {
      batchCalls.addToBatch({ data: 'its here yesss' });
    }
    for (let i = 0; i < 50; i++) {
      expected.push({ data: 'its here yesss' });
    }

    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(expected);
  });

  it('Does not call the given function when less than 50 items are in the batch', () => {
    const batchManagement = new BatchManagement();
    const batchCalls = new BatchCalls(mockFunction, batchManagement);

    for (let i = 0; i < 16; i++) {
      batchCalls.addToBatch({ data: 'its here yesss' });
    }

    expect(mockFunction).not.toBeCalled();
  });

  it('Adds to the same batch even when the data is added to two different BatchCalls instatiations', () => {
    const batchCalls = new BatchCalls(mockFunction, batchManagement);
    const batchCalls2 = new BatchCalls(mockFunction, batchManagement);
    let expectedResult = [];

    for (let i = 0; i < 25; i++) {
      batchCalls.addToBatch({ data: `its here yesss ${i}` });
    }

    for (let i = 25; i < 50; i++) {
      batchCalls2.addToBatch({ data: `its here yesss ${i}` });
    }

    for (let i = 0; i < 50; i++) {
      expectedResult.push({ data: `its here yesss ${i}` });
    }

    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(expectedResult);
  });
});
