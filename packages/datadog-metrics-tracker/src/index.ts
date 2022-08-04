var StatsD = require("hot-shots");

export { MetricsTracker } from './base';
export { ExternalRequestMetricsTracker } from './external-request';
export { KafkaMetricsTracker, ProcessingState } from './kafka';
export { ResponseMetricsTracker } from './response';

export interface DataDogConfig extends NodeJS.ProcessEnv {
  DD_AGENT_PORT?: string,
  DD_SERVICE?: string,
  DD_TAGS?: string,
  DD_ENV?: string,
  DD_AGENT_HOST?: string,
  DD_VERSION?: string,
}

export const createDataDogConnection = (config: DataDogConfig) => {
  var client  = new StatsD({
    port: config.DD_AGENT_PORT,
    host: config.DD_AGENT_HOST,
    globalTags: {
    env: config.DD_ENV,
    service: config.DD_SERVICE,
    version: config.DD_VERSION,
    globalTag1: config.DD_TAGS
  },
    errorHandler: (error:Error) => {
      console.error(error);
    }
  });

  return client ;
};
