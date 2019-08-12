import { DateType, TimestampType } from '@ovotech/avro-logical-types';
import { AvroDeserializer, AvroMessage } from '@ovotech/avro-stream';
import { rePipeline } from '@ovotech/re-pipeline';
import { Logger } from '@ovotech/winston-logger';
import { ConsumerGroupStream, ConsumerGroupStreamOptions } from 'kafka-node';
import { Writable } from 'stream';

interface KafkaConsumerInput {
  OPTIONS: ConsumerGroupStreamOptions;
  KAFKA_SCHEMA_REGISTRY: string;
  KAFKA_TOPICS: string | string[];
}

/**
 * Create and maintain a kafka notification consumer
 *
 * @param env
 * @param logger
 * @param onDetectNotification function to process a given notification
 */
export const createKafkaConsumer = (
  { OPTIONS, KAFKA_SCHEMA_REGISTRY, KAFKA_TOPICS }: KafkaConsumerInput,
  logger: Logger,
  onDetectNotification: (message: AvroMessage) => Promise<void>,
) => {
  const avroDeserializer = new AvroDeserializer(KAFKA_SCHEMA_REGISTRY!, {
    logicalTypes: { date: DateType, 'timestamp-millis': TimestampType },
  });

  const consumerStream = new ConsumerGroupStream(OPTIONS, KAFKA_TOPICS);

  const notificationConsumer = new Writable({
    objectMode: true,
    write: async (message: AvroMessage, _, callback) => {
      // Await the processing of the notification
      await onDetectNotification(message);
      callback();
    },
  });

  rePipeline(error => logger.error(error.message, { error }), consumerStream, avroDeserializer, notificationConsumer);

  return consumerStream;
};
