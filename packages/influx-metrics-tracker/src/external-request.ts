import { MetricsTracker } from './base';

export class ExternalRequestMetricsTracker extends MetricsTracker {
  private static externalRequestTimeMeasurementName = 'external-request-time';

  async trackRequestTime(externalServiceName: string, requestName: string, timeMs: number, statusCode?: number) {
    await this.trackPoint(
      ExternalRequestMetricsTracker.externalRequestTimeMeasurementName,
      { requestName, externalServiceName, status: statusCode ? statusCode.toString() : '' },
      { timeMs: Math.round(timeMs), count: 1 },
    );
  }
}
