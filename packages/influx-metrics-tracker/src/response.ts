import { MetricsTracker } from './base';

export class ResponseMetricsTracker extends MetricsTracker {
  private static ownResponseTimeMeasurementName = 'own-response-time';

  trackOwnResponseTime(requestName: string, timeMs: number, statusCode?: number) {
    this.trackPoint(
      ResponseMetricsTracker.ownResponseTimeMeasurementName,
      { requestName, status: statusCode ? statusCode.toString() : '' },
      { timeMs: Math.round(timeMs), count: 1 },
    );
  }
}
