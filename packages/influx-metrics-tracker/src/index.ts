import { InfluxDB, ISingleHostConfig } from 'influx';

export { MetricsTracker } from './base';
export { ExternalRequestMetricsTracker } from './external-request';
export { KafkaMetricsTracker } from './kafka';
export { ResponseMetricsTracker } from './response';

export interface InfluxConfig extends NodeJS.ProcessEnv {
  INFLUXDB_HOST?: string;
  INFLUXDB_DATABASE?: string;
  INFLUXDB_PORT?: string;
  INFLUXDB_USER?: string;
  INFLUXDB_PASSWORD?: string;
}

export const createInfluxConnection = ({
  INFLUXDB_HOST = '',
  INFLUXDB_DATABASE = 'default-db',
  INFLUXDB_PORT = '15661',
  INFLUXDB_USER = '',
  INFLUXDB_PASSWORD = '',
}: InfluxConfig): InfluxDB => {
  const config: ISingleHostConfig = {
    host: INFLUXDB_HOST,
    database: INFLUXDB_DATABASE,
    port: parseInt(INFLUXDB_PORT, 10),
    username: INFLUXDB_USER,
    password: INFLUXDB_PASSWORD,
    protocol: 'https',
  };
  return new InfluxDB(config);
};
