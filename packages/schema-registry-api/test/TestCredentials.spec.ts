import { Schema } from 'avsc';
import { addSubjectVersion } from '../src';

const schema1: Schema = {
  type: 'record',
  name: 'TestSchema',
  fields: [{ name: 'accountId', type: 'string' }],
};

describe('Unit test', () => {
  it('Test credentials leakage', async () => {
    const url = 'http://user:pass@something.com/';
    try {
      await addSubjectVersion(url, '', schema1);
    } catch (error) {
      expect(error.toString()).toContain('http://{CREDENTIALS}something.com');
    }
  });
});
