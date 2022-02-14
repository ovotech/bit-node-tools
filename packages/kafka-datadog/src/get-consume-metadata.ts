import { CastleEachMessagePayload, CastleEachBatchPayload } from '@ovotech/castle';

export interface MessageWithMetadata {
  metadata: { eventId: string; createdAt: Date; traceToken: string };
}

interface ConsumeMetadata {
  topic: string;
  topic_partition: string;
  topic_key?: string;
  trace_token?: string;
  high_watermark?: string;
  batch_length?: string;
  batch_first_offset?: string;
  batch_last_offset?: string;
}

export function getConsumeMetadata(
  ctx: CastleEachMessagePayload<MessageWithMetadata> & CastleEachBatchPayload<MessageWithMetadata>,
): ConsumeMetadata {
  const info = (ctx.batch ?? ctx) as CastleEachBatchPayload['batch'] & CastleEachMessagePayload;
  let meta: ConsumeMetadata = {
    topic: info.topic,
    topic_partition: `${info.partition}`,
  };
  if (ctx.message) {
    meta = {
      ...meta,
      topic_key: ctx.message.key?.toString(),
    };
    const messageMetadata = ctx.message?.value?.metadata;
    if (messageMetadata && messageMetadata.traceToken) {
      meta.trace_token = messageMetadata.traceToken;
    }
  } else {
    meta = {
      ...meta,
      high_watermark: info.highWatermark,
      batch_length: info.messages.length.toString(),
      batch_first_offset: info.firstOffset() ?? 'null',
      batch_last_offset: info.lastOffset(),
    };
  }
  return meta;
}
