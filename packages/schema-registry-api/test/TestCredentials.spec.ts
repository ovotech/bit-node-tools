import { Schema } from 'avsc';
import { addSubjectVersion } from '../src';
import fetch from 'node-fetch';
import { mocked } from 'ts-jest/utils';

jest.mock('node-fetch');

const schema1: Schema = {
  type: 'record',
  name: 'TestSchema',
  fields: [{ name: 'accountId', type: 'string' }],
};

describe('Unit test', () => {
  it('Test credentials leakage', async () => {
    const mockFetch = mocked(fetch);
    mockFetch.mockRejectedValue(new Error('Error calling http://user:pass@something.com'));
    const url = 'foo';
    try {
      await addSubjectVersion(url, '', schema1);
    } catch (error: any) {
      expect(error.toString()).toContain('http://{CREDENTIALS}something.com');
    }
  });
});
