import getBatchCallsInstance from '../../src/helpers/batch-calls';

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

  it('Does not create any new class instances but instead returns the same singleton class', () => {
    const firstInstance = getBatchCallsInstance(mockFunction, mockLogger);
    const secondInstance = getBatchCallsInstance(mockFunction, mockLogger);
    const thirdInstance = getBatchCallsInstance(mockFunction, mockLogger);
    const fourthInstance = getBatchCallsInstance(mockFunction, mockLogger);

    expect(firstInstance).toBe(secondInstance);
    expect(secondInstance).toBe(thirdInstance);
    expect(thirdInstance).toBe(fourthInstance);
  });

  it('Creates a new instance of a class if the second instance has different parameters', () => {
    const anotherMockFunction = jest.fn().mockReturnValue('blaa');
    const firstInstance = getBatchCallsInstance(mockFunction, mockLogger);
    const secondInstance = getBatchCallsInstance(anotherMockFunction, mockLogger);

    expect(firstInstance).not.toBe(secondInstance);
  });

  it('Returns the correct instance of a class if it has the same parameters', () => {
    const anotherMockFunction = jest.fn().mockReturnValue('blaa');
    const firstInstance = getBatchCallsInstance(mockFunction, mockLogger);
    const secondInstance = getBatchCallsInstance(anotherMockFunction, mockLogger);
    const thirdInstance = getBatchCallsInstance(mockFunction, mockLogger);

    expect(thirdInstance).toBe(firstInstance);
    expect(thirdInstance).not.toBe(secondInstance);
  });

  it('Calls the given function when 50 items are in the batch', () => {
    const batchCalls = getBatchCallsInstance(mockFunction, mockLogger);
    let expected = [];

    for (let i = 0; i < 50; i++) {
      batchCalls.addToBatch({ data: 'its here yesss' });
      expected.push({ data: 'its here yesss' });
    }

    expect(mockFunction).toBeCalledTimes(1);
    expect(mockFunction).toBeCalledWith(expected);
  });

  it('Calls the given function twice when 100 identical items are in the batch', () => {
    const batchCalls = getBatchCallsInstance(mockFunction, mockLogger);
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
    const batchCalls = getBatchCallsInstance(mockFunction, mockLogger);
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
    const batchCalls = getBatchCallsInstance(mockFunction, mockLogger);
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
    const batchCalls = getBatchCallsInstance(mockFunction, mockLogger);
    let expected = [];

    for (let i = 0; i < 16; i++) {
      batchCalls.addToBatch({ data: 'its here yesss' });
    }

    expect(mockFunction).not.toBeCalled();
  });
});
