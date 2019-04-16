import { InMemoryLRUCache } from 'apollo-server-caching';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import * as nock from 'nock';
import { TestDataSource } from './TestDataSource';

const cache = new InMemoryLRUCache();
const config = { context: {}, cache: cache as any };
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

    const req = {
      onFulfilled: jest.fn().mockImplementation(cfg => cfg),
      onRejected: jest.fn().mockImplementation(err => err),
    };

    const res = {
      onFulfilled: jest.fn().mockImplementation(response => response),
      onRejected: jest.fn().mockImplementation(err => err),
    };

    const intercepted = new TestDataSource(undefined, { request: [req], response: [res] });
    intercepted.initialize(config);

    await expect(intercepted.get('http://api.example.com/users/14')).resolves.toHaveProperty('status', 200);
    await expect(intercepted.get('http://api.example.com/users/15')).resolves.toEqual(
      new ApolloError('Request failed with status code 404'),
    );

    expect(req.onFulfilled).toHaveBeenCalled();
    expect(res.onFulfilled).toHaveBeenCalled();

    expect(res.onRejected).toHaveBeenCalled();
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
