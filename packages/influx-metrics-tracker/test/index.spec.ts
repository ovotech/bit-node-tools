jest.mock('influx');
import { InfluxDB } from 'influx';
import { createInfluxConnection, InfluxConfig } from '../src/index';

describe('Create InfluxDB and connection', () => {
  it('Should create a DB with partial config', () => {
    const config: InfluxConfig = {
      INFLUXDB_HOST: 'test-host',
      INFLUXDB_PORT: '123',
      INFLUXDB_USER: 'test-user',
      INFLUXDB_PASSWORD: 'test-password',
    };

    createInfluxConnection(config);

    expect(InfluxDB).lastCalledWith({
      database: 'default-db',
      host: 'test-host',
      password: 'test-password',
      port: 123,
      protocol: 'https',
      username: 'test-user',
    });
  });
});
