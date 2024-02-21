import { createDataDogConnection, DataDogConfig } from '../src/index';


describe('Create Datadog and connection', () => {

  const config: DataDogConfig = {
    DD_AGENT_PORT: '8125',
    DD_SERVICE: 'retail-payg-portal-api',
    DD_TAGS: 'env:nonprod,team:retail-payg,',
    DD_ENV: 'Uat',
    DD_AGENT_HOST: '10.145.0.113',
    DD_VERSION: 'uat-0.0.177',
  };
  const client = createDataDogConnection(config);


  it('Datadog Connection Running Successfully', () => {

    // Timer: Returns a function that you call to record how long the first
    // parameter takes to execute (in milliseconds) and then sends that value
    // using 'client.timing'.
    // The parameters after the first one (in this case 'fn')
    // match those in 'client.timing'.
    const fn = function (testMessage: String) { return testMessage };
    const conMsg = client.timer(fn, 'fn_execution_time')("Datadog connection running successfully..");

    expect(conMsg).toBe("Datadog connection running successfully..");

  });
});
