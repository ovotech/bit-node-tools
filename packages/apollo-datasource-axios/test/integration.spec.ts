import { InMemoryLRUCache } from 'apollo-server-caching';
import { ApolloError } from 'apollo-server-errors';
import * as nock from 'nock';
import { TestDataSource } from './TestDataSource';

const api = nock('http://api.example.com');
const cache = new InMemoryLRUCache();
const config = { context: {}, cache: cache as any };
const dataSource = new TestDataSource({ baseURL: 'http://api.example.com' });
dataSource.initialize(config);

describe('Integration test', () => {
  beforeEach(() => cache.flush());
  it('Test cached event', async () => {
    api.get('/users/12').reply(200, { id: 12, name: 'John' });
    const user = await dataSource.users('12');

    expect(user.status).toEqual(200);
    expect(user.data).toEqual({ id: 12, name: 'John' });
    expect(cache.getTotalSize()).resolves.toBeGreaterThan(0);
  });

  it('Test cache set and retrieve', async () => {
    nock('http://api.example.com')
      .get('/users/12')
      .reply(200, { id: 12, name: 'John' }, { 'Cache-Control': 'max-age=1' });

    nock('http://api.example.com')
      .get('/users/12')
      .reply(200, { id: 12, name: 'Other' }, { 'Cache-Control': 'max-age=1' });

    const user1 = await dataSource.users('12');
    const user2 = await dataSource.users('12');

    await new Promise(resolve => setTimeout(resolve, 1200));

    const user3 = await dataSource.users('12');

    expect(user1.status).toEqual(200);
    expect(user1.data).toEqual({ id: 12, name: 'John' });

    expect(user2.status).toEqual(200);
    expect(user2.data).toEqual({ id: 12, name: 'John' });

    expect(user3.status).toEqual(200);
    expect(user3.data).toEqual({ id: 12, name: 'Other' });
  });

  it('Test interceptors', async () => {
    api.get('/users/12').reply(200, { id: 12, name: 'John' });

    const req = {
      onFulfilled: jest.fn().mockImplementation(cfg => cfg),
      onRejected: jest.fn().mockImplementation(err => err),
    };

    const res = {
      onFulfilled: jest.fn().mockImplementation(response => response),
      onRejected: jest.fn().mockImplementation(err => err),
    };

    nock('http://api.example.com')
      .get('/users/12')
      .reply(200, { id: 12, name: 'Other' });

    nock('http://api.example.com')
      .get('/users/13')
      .reply(404);

    const intercepted = new TestDataSource({ baseURL: 'http://api.example.com' }, { request: [req], response: [res] });
    intercepted.initialize(config);

    await expect(intercepted.users('12')).resolves.toHaveProperty('status', 200);
    await expect(intercepted.users('13')).resolves.toEqual(new ApolloError('Request failed with status code 404'));

    expect(req.onFulfilled).toHaveBeenCalled();
    expect(res.onFulfilled).toHaveBeenCalled();

    expect(res.onRejected).toHaveBeenCalled();
  });
});
