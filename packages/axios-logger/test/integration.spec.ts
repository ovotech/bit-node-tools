import axios from 'axios';
import * as nock from 'nock';
import { axiosLogger, redactHeader } from '../src';

const log = jest.fn();
const instance = axios.create({ baseURL: 'http://api.example.com' });
const logger = axiosLogger((level, meta) => log(level, meta));

instance.interceptors.request.use(logger.request.onFulfilled);
instance.interceptors.response.use(logger.response.onFulfilled, logger.response.onRejected);

describe('Integration test', () => {
  beforeEach(() => log.mockClear());

  it('Test logger response', async () => {
    nock('http://api.example.com')
      .get('/users/12')
      .reply(200, { id: 12, name: 'John' });

    await instance.get('/users/12');

    expect(log).toHaveBeenCalledWith('info', {
      uri: '<Removed>',
      method: 'get',
      responseBody: '<Removed>',
      status: 200,
      responseTime: expect.any(Number),
    });
  });

  it('Test logger error', async () => {
    nock('http://api.example.com')
      .get('/users/13')
      .reply(404, { message: 'not found' });

    await expect(instance.get('/users/13')).rejects.toHaveProperty(
      'response',
      expect.objectContaining({ status: 404 }),
    );

    expect(log).toHaveBeenCalledWith('error', {
      uri: '<Removed>',
      method: 'get',
      status: 404,
      responseTime: expect.any(Number),
    });
  });

  it('Test redact paths', async () => {
    nock('http://api.example.com')
      .post('/users/13')
      .reply(200, { saved: 'yes', cards: [{ id: '111', name: 'Me' }, { id: '222', name: 'Me' }] });

    const body = { name: 'John', cards: [{ id: '111', name: 'Me' }, { id: '222', name: 'Me' }] };

    await instance.post('/users/13', body, {
      headers: { [redactHeader]: 'requestBody.cards.*.id,responseBody.cards.*.name' },
    });

    expect(log).toHaveBeenCalledWith('info', {
      uri: '/users/13',
      method: 'post',
      params: undefined,
      responseBody: {
        cards: [{ id: '111', name: '<Removed>' }, { id: '222', name: '<Removed>' }],
        saved: 'yes',
      },
      requestBody: {
        cards: [{ id: '<Removed>', name: 'Me' }, { id: '<Removed>', name: 'Me' }],
        name: 'John',
      },
      status: 200,
      responseTime: expect.any(Number),
    });
  });

  it('Test redact paths error', async () => {
    nock('http://api.example.com')
      .patch('/users/13')
      .reply(404, { message: 'not found' });

    const body = { name: 'John', cards: [{ id: '111', name: 'Me' }, { id: '222', name: 'Me' }] };

    await expect(
      instance.patch('/users/13', body, {
        headers: { [redactHeader]: 'requestBody.cards.*.id, responseBody.cards.*.name' },
      }),
    ).rejects.toHaveProperty('response', expect.objectContaining({ status: 404 }));

    expect(log).toHaveBeenCalledWith('error', {
      uri: '/users/13',
      params: undefined,
      method: 'patch',
      status: 404,
      requestBody: {
        cards: [{ id: '<Removed>', name: 'Me' }, { id: '<Removed>', name: 'Me' }],
        name: 'John',
      },
      responseTime: expect.any(Number),
    });
  });
});
