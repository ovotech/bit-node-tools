import { InMemoryLRUCache } from 'apollo-server-caching';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import * as nock from 'nock';
import { Interceptor } from '../src';
import { AdditionalConfig, TestDataSource } from './TestDataSource';

const cache = new InMemoryLRUCache();
const config = { context: { test: '123' }, cache };
const dataSource = new TestDataSource({ baseURL: 'http://api.example.com' });
dataSource.initialize(config);

describe('Integration test', () => {
  beforeEach(() => cache.flush());
  it('Test cached event', async () => {
    nock('http://api.example.com')
      .get('/users/12')
      .reply(200, { id: 12, name: 'John' });

    const user = await dataSource.users('12');

    expect(user.status).toEqual(200);
    expect(user.data).toEqual({ id: 12, name: 'John' });
    expect(user.config.dataSourceVersion).toEqual('test');
    expect(user.config.context).toEqual({ test: '123' });
    expect(cache.getTotalSize()).resolves.toBeGreaterThan(0);
  });

  it('Test cache set and retrieve', async () => {
    nock('http://api.example.com')
      .get('/users/13')
      .reply(200, { id: 13, name: 'John' }, { 'Cache-Control': 'max-age=1' })
      .get('/users/13')
      .reply(200, { id: 13, name: 'Other' }, { 'Cache-Control': 'max-age=1' });

    const user1 = await dataSource.users('13');
    const user2 = await dataSource.users('13');

    await new Promise(resolve => setTimeout(resolve, 1200));

    const user3 = await dataSource.users('13');

    expect(user1.status).toEqual(200);
    expect(user1.data).toEqual({ id: 13, name: 'John' });

    expect(user2.status).toEqual(200);
    expect(user2.data).toEqual({ id: 13, name: 'John' });

    expect(user3.status).toEqual(200);
    expect(user3.data).toEqual({ id: 13, name: 'Other' });
  });

  it('Test interceptors', async () => {
    nock('http://api.example.com')
      .get('/users/14')
      .reply(200, { id: 14, name: 'John' })
      .get('/users/14')
      .reply(200, { id: 14, name: 'Other' })
      .get('/users/15')
      .reply(404);

    const reqCall = jest.fn();
    const resCall = jest.fn();
    const reqErrorCall = jest.fn();
    const resErrorCall = jest.fn();

    const interceptor: Interceptor<AdditionalConfig> = {
      request: {
        onFulfilled: cfg => {
          expect(cfg.dataSourceVersion).toEqual('test2');
          reqCall();
          return cfg;
        },
        onRejected: err => {
          expect(err.config).toEqual('test2');
          reqErrorCall();
          return err;
        },
      },
      response: {
        onFulfilled: response => {
          expect(response.config.dataSourceVersion).toEqual('test2');
          resCall();
          return response;
        },
        onRejected: err => {
          expect(err.config.dataSourceVersion).toEqual('test2');
          resErrorCall();
          return err;
        },
      },
    };

    const intercepted = new TestDataSource({ interceptors: [interceptor] });
    intercepted.initialize(config);

    await expect(
      intercepted.get('http://api.example.com/users/14', { dataSourceVersion: 'test2' }),
    ).resolves.toHaveProperty('status', 200);

    await expect(intercepted.get('http://api.example.com/users/15', { dataSourceVersion: 'test2' })).resolves.toEqual(
      new ApolloError('Request failed with status code 404'),
    );

    expect(reqCall).toHaveBeenCalled();
    expect(resCall).toHaveBeenCalled();

    expect(reqErrorCall).not.toHaveBeenCalled();
    expect(resErrorCall).toHaveBeenCalled();
  });

  it('Test AuthenticationError', async () => {
    nock('http://api.example.com')
      .get('/users/16')
      .reply(401, { message: 'unknown user' });

    await expect(dataSource.users('16')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('Test ForbiddenError', async () => {
    nock('http://api.example.com')
      .get('/users/17')
      .reply(403, { message: 'unknown user' });

    await expect(dataSource.users('17')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('Test ApolloError', async () => {
    nock('http://api.example.com')
      .get('/users/18')
      .reply(500, { message: 'unknown' });

    const result = dataSource.users('18');
    await expect(result).rejects.toBeInstanceOf(ApolloError);
    await expect(result).rejects.toHaveProperty(
      'extensions',
      expect.objectContaining({
        response: {
          url: 'http://api.example.com/users/18',
          status: 500,
          statusText: null,
          data: { message: 'unknown' },
        },
      }),
    );
  });

  it('Test methods', async () => {
    nock('http://api.example.com')
      .post('/users/19', { test: 'post' })
      .reply(200, { message: 'post' });

    nock('http://api.example.com')
      .head('/users/20')
      .reply(200);

    nock('http://api.example.com')
      .put('/users/21', { test: 'put' })
      .reply(200, { message: 'put' });

    nock('http://api.example.com')
      .patch('/users/22', { test: 'patch' })
      .reply(200, { message: 'patch' });

    nock('http://api.example.com')
      .delete('/users/23')
      .reply(200, { message: 'delete' });

    await expect(dataSource.post('/users/19', { test: 'post' })).resolves.toHaveProperty('data', { message: 'post' });
    await expect(dataSource.head('/users/20')).resolves.toHaveProperty('status', 200);
    await expect(dataSource.put('/users/21', { test: 'put' })).resolves.toHaveProperty('data', { message: 'put' });
    await expect(dataSource.patch('/users/22', { test: 'patch' })).resolves.toHaveProperty('data', {
      message: 'patch',
    });
    await expect(dataSource.delete('/users/23')).resolves.toHaveProperty('status', 200);
  });
});
