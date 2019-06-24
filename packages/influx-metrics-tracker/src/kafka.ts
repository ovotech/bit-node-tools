import { MetricsTracker } from './base';

export class KafkaMetricsTracker extends MetricsTracker {
  private static eventProcessedMeasurementName = 'kafka-event-processed';
  private static eventReceivedMeasurementName = 'kafka-event-received';

  async trackEventReceived(eventName: string, ageMs: number) {
    await this.trackPoint(KafkaMetricsTracker.eventReceivedMeasurementName, { eventName }, { count: 1, ageMs });
  }

  async trackEventProcessed(eventName: string, processingState: KafkaMetricsTracker.ProcessingState) {
    await this.trackPoint(
      KafkaMetricsTracker.eventProcessedMeasurementName,
      { eventName, processingState },
      { count: 1 },
    );
  }
}

// tslint:disable-next-line:no-namespace
export namespace KafkaMetricsTracker {
  export enum ProcessingState {
    Error = 'error',
    Success = 'success',
  }
}
