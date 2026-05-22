import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
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

    const start = new ReadableMock(['test', '   other', ' last  '], { objectMode: true });
    const end = new WritableMock({ objectMode: true });

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

    const start = new ReadableMock(['test', '   other', 'error', ' last  '], { objectMode: true });
    const end = new WritableMock({ objectMode: true });
    const errorCheck = jest.fn();

    await pipelinePromise(start, trimStream, throwStream, uppercaseStream, end).catch(errorCheck);

    expect(end.data).toEqual(['TEST', 'OTHER']);
    expect(errorCheck).toHaveBeenCalledWith(new Error('from stream'));
  });

  it.only('Test rePipeline with multiple error handling', async (cb) => {
    const trimStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) => callback(undefined, String(item).trim()),
    });

    const throwStream = new Transform({
      objectMode: true,
      transform: (item, encoding, callback) =>
        callback(item === 'error' ? new Error('from stream') : undefined, item !== 'error' ? item : undefined),
    });

    const start = new ReadableMock(['test', '   other', 'error', 'error', ' last  '], { objectMode: true });
    const end = new WritableMock({ objectMode: true });

    const errorCheck = jest.fn((error) => { console.log("got error", error) });
    const pipeline = rePipeline(errorCheck, start, trimStream, throwStream, end);

    console.log('*****************************************************');
    pipeline.on("error", () => console.log("error"))
    pipeline.on("end", () => console.log("end"))
    await new Promise(resolve => pipeline.on('finish', () => {

      resolve(null)
    }));

    expect(end.data).toEqual(['test', 'other', 'last']);
    expect(errorCheck).toHaveBeenCalledTimes(2);
    expect(errorCheck).toHaveBeenCalledWith(new Error('from stream'));
    cb()
  }, 15000);
});
