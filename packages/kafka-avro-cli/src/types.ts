import { Message } from 'kafka-node';

export interface BrokerMetadata {
  nodeId: number;
  host: string;
  port: number;
}

export interface TopicMetadata {
  [partition: number]: PartitionMetadata;
}

export interface PartitionMetadata {
  topic: string;
  partition: number;
  leader: number;
  replicas: number[];
  isr: number[];
}

export type MetadataResult = [{ [key: string]: BrokerMetadata }, { metadata: { [key: string]: TopicMetadata } }];

export interface ProgressMessage extends Message {
  progress: Progress;
}

export interface Progress {
  total: number;
  totalCount: number;
  partitions: PartitionProgressMap;
}

export interface PartitionProgressMap {
  [parition: string]: PartitionProgress;
}

export interface PartitionProgress {
  offset: number;
  progress: number;
  highWaterOffset: number;
}
