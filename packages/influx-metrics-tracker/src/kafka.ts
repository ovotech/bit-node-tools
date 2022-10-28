import { MetricsTracker } from './base';

export class KafkaMetricsTracker extends MetricsTracker {
  private static eventProcessedMeasurementName = 'kafka-event-processed';
  private static eventReceivedMeasurementName = 'kafka-event-received';

  async trackEventReceived(eventName: string, ageMs: number, timestamp?: Date) {
    await this.trackPoint(
      KafkaMetricsTracker.eventReceivedMeasurementName,
      { eventName },
      { count: 1, ageMs: Math.round(ageMs) },
      timestamp,
    );
  }

  async trackEventProcessed(eventName: string, processingState: ProcessingState, timestamp?: Date) {
    await this.trackPoint(
      KafkaMetricsTracker.eventProcessedMeasurementName,
      { eventName, processingState },
      { count: 1 },
      timestamp,
    );
  }
}

export enum ProcessingState {
  Error = 'error',
  Success = 'success',
}
