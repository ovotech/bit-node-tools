var StatsD = require("hot-shots");

export { MetricsTracker } from './base';
export { ExternalRequestMetricsTracker } from './external-request';
export { KafkaMetricsTracker, ProcessingState } from './kafka';
export { ResponseMetricsTracker } from './response';
import { Logger } from '@ovotech/winston-logger';

export interface DataDogConfig extends NodeJS.ProcessEnv {
  DD_AGENT_PORT?: string,
  DD_SERVICE?: string,
  DD_ENV?: string,
  DD_AGENT_HOST?: string,
}

export const createDataDogConnection = (config: DataDogConfig) => {
  var client  = new StatsD({
    port: config.DD_AGENT_PORT, //To make the connection b/w agent and datadog
    host: config.DD_AGENT_HOST, //It collects events and metrics from hosts and sends them to Datadog
    globalTags: {
    env: config.DD_ENV, //To check the metrics according to environment wise
    service: config.DD_SERVICE, //To check the metrics according to service wise
  },
    errorHandler: (error:Error, logger:Logger) => {
      logger.error('Error tracking Datadog metric',error);
    }
  });

  return client ;
};
