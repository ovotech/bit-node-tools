import { Readable, Writable } from 'stream';

export const rePipeline = (errorHandler: (error: Error) => void, ...streams: Array<Readable | Writable>) =>
  streams.reduce((prev, stream) =>
    prev.pipe(stream as Writable).on('error', error => {
      errorHandler(error);
      prev.pipe(stream as Writable);
    }),
  );

export const pipelinePromise = (...streams: Array<Readable | Writable>) =>
  new Promise((resolve, reject) =>
    streams
      .reduce((prev, stream) => prev.pipe(stream as Writable).on('error', error => reject(error)))
      .on('finish', resolve)
      .on('close', resolve),
  );
