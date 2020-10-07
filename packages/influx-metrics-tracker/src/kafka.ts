import { MetricsTracker } from './base';

export class KafkaMetricsTracker extends MetricsTracker {
  private static eventProcessedMeasurementName = 'kafka-event-processed';
  private static eventReceivedMeasurementName = 'kafka-event-received';

  trackEventReceived(eventName: string, ageMs: number) {
    this.trackPoint(
      KafkaMetricsTracker.eventReceivedMeasurementName,
      { eventName },
      { count: 1, ageMs: Math.round(ageMs) },
    );
  }

  async trackEventProcessed(eventName: string, processingState: ProcessingState) {
    this.trackPoint(
      KafkaMetricsTracker.eventProcessedMeasurementName,
      { eventName, processingState },
      { count: 1 },
    );
  }
}

export enum ProcessingState {
  Error = 'error',
  Success = 'success',
}
