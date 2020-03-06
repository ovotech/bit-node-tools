import { ObjectWritableMock } from 'stream-mock';
import { createLogger, transports } from 'winston';
import { Logger } from '../src';

describe('Integration test', () => {
  it('Test with real stream', async () => {
    const stream = new ObjectWritableMock();
    const transport = new transports.Stream({ stream });
    const winstonLogger = createLogger({ exitOnError: false, transports: [transport] });

    const logger = new Logger(winstonLogger, { test1: 'test1' });

    logger.error('send test', { test2: 'test2' });
    logger.info('other test', { test3: 'test3' });

    expect(stream.data).toEqual([
      expect.objectContaining({ message: 'send test', metadata: { test2: 'test2', test1: 'test1' }, level: 'error' }),
      expect.objectContaining({ message: 'other test', metadata: { test3: 'test3', test1: 'test1' }, level: 'info' }),
    ]);
  });
});
