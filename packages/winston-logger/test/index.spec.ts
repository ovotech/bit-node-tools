import { Logger } from '../src';

describe('Winston Logger', () => {
  it.each`
    level       | message          | meta
    ${'silly'}  | ${'test-silly'}  | ${{ silly: 'test' }}
    ${'notice'} | ${'test-notice'} | ${{ notice: 'test' }}
    ${'warn'}   | ${'test-warn'}   | ${{ warn: 'test' }}
    ${'error'}  | ${'error'}       | ${{ error: new Error('err') }}
    ${'info'}   | ${'test-info'}   | ${{ info: 'test' }}
  `('Test logger for $level', ({ level, message, meta }) => {
    const winstonLogger: any = { log: jest.fn() };

    const logger = new Logger(winstonLogger, { test1: 'test2' });
    const logger2 = logger.withStaticMeta({ test3: 'test4' });

    // @ts-ignore
    logger[level](message, meta);
    logger2.log(level, message, { test5: 'test6', ...meta });

    expect(logger).not.toBe(logger2);
    expect(logger.staticMeta).toEqual({ test1: 'test2' });
    expect(logger2.staticMeta).toEqual({ test1: 'test2', test3: 'test4' });

    expect(winstonLogger.log).toHaveBeenNthCalledWith(1, level, message, {
      metadata: { test1: 'test2', ...meta },
    });

    expect(winstonLogger.log).toHaveBeenNthCalledWith(2, level, message, {
      metadata: { test1: 'test2', test3: 'test4', test5: 'test6', ...meta },
    });
  });
});
