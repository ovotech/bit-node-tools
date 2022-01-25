import { Transform } from 'stream';
import { ObjectReadableMock, ObjectWritableMock } from 'stream-mock';
import { pipelinePromise, rePipeline } from '../src';

describe('Re Pipeline', () => {
  it('Test pipelinePromise', async () => {
    const trimStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) => callback(undefined, String(item).trim()),
    });

    const uppercaseStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) => callback(undefined, String(item).toUpperCase()),
    });

    const start = new ObjectReadableMock(['test', '   other', ' last  '], { objectMode: true });
    const end = new ObjectWritableMock({ objectMode: true });

    await pipelinePromise(start, trimStream, uppercaseStream, end);

    expect(end.data).toEqual(['TEST', 'OTHER', 'LAST']);
  });

  it('Test pipelinePromise error handling', async () => {
    const trimStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) => callback(undefined, String(item).trim()),
    });

    const uppercaseStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) => callback(undefined, String(item).toUpperCase()),
    });

    const throwStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) =>
        callback(item === 'error' ? new Error('from stream') : undefined, item !== 'error' ? item : undefined),
    });

    const start = new ObjectReadableMock(['test', '   other', 'error', ' last  '], { objectMode: true });
    const end = new ObjectWritableMock({ objectMode: true });
    const errorCheck = jest.fn();

    await pipelinePromise(start, trimStream, throwStream, uppercaseStream, end).catch(errorCheck);

    expect(end.data).toEqual(['TEST', 'OTHER']);
    expect(errorCheck).toHaveBeenCalledWith(new Error('from stream'));
  });

  it('Test rePipeline with multiple error handling', async () => {
    const trimStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) => callback(undefined, String(item).trim()),
    });

    const throwStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) =>
        callback(item === 'error' ? new Error('from stream') : undefined, item !== 'error' ? item : undefined),
    });

    const start = new ObjectReadableMock(['test', '   other', 'error', 'error', ' last  '], { objectMode: true });
    const end = new ObjectWritableMock({ objectMode: true });

    const errorCheck = jest.fn();
    const pipeline = rePipeline(errorCheck, start, trimStream, throwStream, end);

    await new Promise(resolve => pipeline.on('finish', resolve));

    expect(end.data).toEqual(['test', 'other', 'last']);
    expect(errorCheck).toHaveBeenCalledTimes(2);
    expect(errorCheck).toHaveBeenCalledWith(new Error('from stream'));
  });
});
