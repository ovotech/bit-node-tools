var StatsD = require("hot-shots");

export { MetricsTracker } from './base';
export { ExternalRequestMetricsTracker } from './external-request';
export { KafkaMetricsTracker, ProcessingState } from './kafka';
export { ResponseMetricsTracker } from './response';

export interface DataDogConfig extends NodeJS.ProcessEnv {
  DATADOG_HOST?: string;
  DATADOG_PORT?: string;
}

export const createDataDogConnection = ({DATADOG_HOST = '', DATADOG_PORT = '15661'}: DataDogConfig) => {
  var client  = new StatsD({
    port: DATADOG_PORT,
    host: DATADOG_HOST,
    errorHandler: (error:Error) => {
      console.error(error);
    }
  });

  return client ;
};
