import { Logger, LoggerMeta, LoggerSanitizer } from '../src';

interface Test {
  level: 'silly' | 'notice' | 'warn' | 'error' | 'info';
  message: string;
  meta: LoggerMeta;
}

describe('Winston Logger', () => {
  it.each`
    level       | message          | meta
    ${'silly'}  | ${'test-silly'}  | ${{ silly: 'test' }}
    ${'notice'} | ${'test-notice'} | ${{ notice: 'test' }}
    ${'warn'}   | ${'test-warn'}   | ${{ warn: 'test' }}
    ${'error'}  | ${'error'}       | ${{ error: new Error('err') }}
    ${'info'}   | ${'test-info'}   | ${{ info: 'test' }}
  `('Test logger for $level', ({ level, message, meta }: Test) => {
    const winstonLogger = { log: jest.fn() };

    const logger = new Logger(winstonLogger, { test1: 'test2' });
    const logger2 = logger.withStaticMeta({ test3: 'test4' });

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

  it.each<[{}, {}, {}]>([
    [{ email: 'test@example.com' }, { uri: '/test' }, { uri: '/test' }],
    [{}, { error: new Error('test') }, {}],
    [
      { test1: 'test2' },
      { error: new Error('test'), email: 'test@example.com', uri: '/test' },
      { test1: 'test2', uri: '/test' },
    ],
  ])('Test sanitize', (init, meta, expected) => {
    const winstonLogger = { log: jest.fn() };
    const sanitizer1: LoggerSanitizer = data => {
      const { error, ...rest } = data;
      return rest;
    };

    const sanitizer2: LoggerSanitizer = data => {
      const { email, ...rest } = data;
      return rest;
    };

    const logger = new Logger(winstonLogger, init, [sanitizer1, sanitizer2]);

    logger.info('Test 1', meta);

    expect(winstonLogger.log).toHaveBeenNthCalledWith(1, 'info', 'Test 1', {
      metadata: expected,
    });
  });

  it('Test withSanitizers', () => {
    const winstonLogger = { log: jest.fn() };
    const sanitizer1: LoggerSanitizer = data => {
      const { error, ...rest } = data;
      return rest;
    };

    const sanitizer2: LoggerSanitizer = data => {
      const { email, ...rest } = data;
      return rest;
    };

    const logger1 = new Logger(winstonLogger, { test: 'test2' }, [sanitizer1]);
    const logger2 = logger1.withSanitizers([sanitizer2]);

    logger1.info('Test 1', { error: new Error('test'), email: 'test@example.com' });
    logger2.info('Test 2', { error: new Error('test'), email: 'test@example.com' });

    expect(winstonLogger.log).toHaveBeenNthCalledWith(1, 'info', 'Test 1', {
      metadata: { test: 'test2', email: 'test@example.com' },
    });
    expect(winstonLogger.log).toHaveBeenNthCalledWith(2, 'info', 'Test 2', {
      metadata: { test: 'test2' },
    });
  });
});
