import { KafkaClientOptions } from 'kafka-node';

export interface Args {
  config: string;
}

export interface Config {
  kafkaClient?: KafkaClientOptions;
  schemaRegistry?: string;
}
