jest.mock('influx');
import { createDataDogConnection, DataDogConfig } from '../src/index';


describe('Create Datadog and connection', () => {

  const config: DataDogConfig = {
    DATADOG_HOST: '10.145.0.113',
    DATADOG_PORT: '8125'
  };
  const client  = createDataDogConnection(config);

  it('Checking Datadog Connection', () => {

    //Adding addtional configuration to Datadog
    var childClient = client.childClient({
      prefix: 'additionalPrefix.',
      suffix: '.additionalSuffix',
      globalTags: { globalTag1: 'forAllMetricsFromChildClient'}
    });

    expect(childClient.host).toBe(config.DATADOG_HOST);

  });

  it('Datadog Connection Running Successfully', () => {

    // Timer: Returns a function that you call to record how long the first
    // parameter takes to execute (in milliseconds) and then sends that value
    // using 'client.timing'.
    // The parameters after the first one (in this case 'fn')
    // match those in 'client.timing'.
    const fn = function(testMessage: String) { return testMessage };
    const conMsg = client.timer(fn, 'fn_execution_time')("Datadog connection running successfully..");

    expect(conMsg).toBe("Datadog connection running successfully..");

  });
});
