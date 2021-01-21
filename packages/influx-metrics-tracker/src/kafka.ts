import { MetricsTracker } from './base';

export class KafkaMetricsTracker extends MetricsTracker {
  private static eventProcessedMeasurementName = 'kafka-event-processed';
  private static eventReceivedMeasurementName = 'kafka-event-received';

  async trackEventReceived(eventName: string, ageMs: number) {
    await this.trackPoint(
      KafkaMetricsTracker.eventReceivedMeasurementName,
      { eventName },
      { count: 1, ageMs: Math.round(ageMs) },
    );
  }

  async trackEventProcessed(eventName: string, processingState: ProcessingState) {
    await this.trackPoint(
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
