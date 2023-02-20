import { MetricsTracker } from './base';

export class KafkaMetricsTracker extends MetricsTracker {
  private static eventProcessedMeasurementName = 'kafka-event-processed';
  private static eventReceivedMeasurementName = 'kafka-event-received';

  async trackEventReceived(eventName: string, ageMs: number) {
    await this.trackPoint(KafkaMetricsTracker.eventReceivedMeasurementName, { eventName });
  }

  async trackEventProcessed(eventName: string, processingState: ProcessingState) {
    await this.trackPoint(KafkaMetricsTracker.eventProcessedMeasurementName, { eventName, processingState });
  }
}

export enum ProcessingState {
  Error = 'error',
  Success = 'success',
}
