import { MetricsTracker } from './base';

export class ResponseMetricsTracker extends MetricsTracker {
  private static ownResponseTimeMeasurementName = 'own-response-time';

  async trackOwnResponseTime(requestName: string, timeMs: number, statusCode?: number, timestamp?: Date) {
    await this.trackPoint(
      ResponseMetricsTracker.ownResponseTimeMeasurementName,
      { requestName, status: statusCode ? statusCode.toString() : '' },
      { timeMs: Math.round(timeMs), count: 1 },
      timestamp,
    );
  }
}
