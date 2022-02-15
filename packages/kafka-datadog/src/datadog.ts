import { CastleEachBatchPayload, CastleEachMessagePayload, Middleware } from '@ovotech/castle';
import { getConsumeMetadata, MessageWithMetadata } from './get-consume-metadata';

export interface DependenciesContext<T> {
  dependencies: T;
}

/**
 * Middleware that instruments a Kafka consumer with datadog APM and metrics
 */
export const datadog: Middleware<
  object,
  DependenciesContext<any> & CastleEachMessagePayload<MessageWithMetadata> & CastleEachBatchPayload<MessageWithMetadata>
> = next => ctx => {
  const meta = getConsumeMetadata(ctx);
  return ctx.dependencies.tracer.trace('kafka.consume', { resource: meta.topic }, async () => {
    const start = Date.now();

    const logger = ctx.dependencies.logger.withStaticMeta(meta);

    try {
      return await next({
        ...ctx,
        dependencies: {
          ...ctx.dependencies,
          logger,
        },
      });
    } finally {
      const now = Date.now();
      ctx.dependencies.metricsTracker.timing('kafka_consumer.consume_time', now - start, {
        topic: meta.topic,
      });
      const messages = ctx.batch ? ctx.batch.messages : [ctx.message];
      messages.forEach(message => {
        if (message.timestamp) {
          ctx.dependencies.metricsTracker.timing(
            'kafka_consumer.consumption_latency',
            now - new Date(parseInt(message.timestamp)).getTime(),
            {
              topic: meta.topic,
            },
          );
        }
      });
    }
  });
};
