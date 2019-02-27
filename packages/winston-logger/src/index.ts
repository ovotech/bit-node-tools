import * as winston from 'winston';

export interface LoggerMeta {
  traceToken?: string;
  error?: Error;
  [key: string]: any;
}

export class Logger {
  constructor(private logger: winston.Logger, readonly staticMeta: LoggerMeta = {}) {}

  withStaticMeta(meta: LoggerMeta) {
    return new Logger(this.logger, { ...this.staticMeta, ...meta });
  }

  log(level: string, message: string, meta?: LoggerMeta) {
    const metadata = {
      ...meta,
      ...this.staticMeta,
    };

    this.logger.log(level, message, { metadata });
    return this;
  }

  error(message: string, meta?: LoggerMeta) {
    return this.log('error', message, meta);
  }

  warn(message: string, meta?: LoggerMeta) {
    return this.log('warn', message, meta);
  }

  notice(message: string, meta?: LoggerMeta) {
    return this.log('notice', message, meta);
  }

  info(message: string, meta?: LoggerMeta) {
    return this.log('info', message, meta);
  }

  silly(message: string, meta?: LoggerMeta) {
    return this.log('silly', message, meta);
  }
}
