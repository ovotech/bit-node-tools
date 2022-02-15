/* eslint-disable @typescript-eslint/no-namespace */

export type HelloWorldV1 = ComOvoenergyKafkaBoostNotification.HelloWorldV1;

export namespace ComOvoenergyKafkaCommonEvent {
  export const EventMetadataName = 'com.ovoenergy.kafka.common.event.EventMetadata';
  export interface EventMetadata {
    eventId: string;
    traceToken: string;
    createdAt: Date;
  }
}

export namespace ComOvoenergyKafkaBoostNotification {
  export const HelloWorldV1Name = 'com.ovoenergy.kafka.boost.notification.HelloWorldV1';
  export interface HelloWorldV1 {
    /**
     * Hello World
     */
    message: string;
    metadata: ComOvoenergyKafkaCommonEvent.EventMetadata;
  }
}
