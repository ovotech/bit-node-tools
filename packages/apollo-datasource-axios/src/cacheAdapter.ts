import { KeyValueCache } from 'apollo-server-caching';
import { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as CachePolicy from 'http-cache-semantics';
import { URLSearchParams } from 'url';

const cacheKey = ({ method, url, params }: AxiosRequestConfig) => {
  return `${method}:${url}:${new URLSearchParams(params).toString()}`;
};

const serialize = ({ data, headers, status, statusText }: AxiosResponse, policy: CachePolicy) => {
  return JSON.stringify({ data, headers, status, statusText, policy: policy.toObject() });
};

const deserialize = (config: AxiosRequestConfig, entry: string): [AxiosResponse, CachePolicy] => {
  const { data, headers, status, statusText, policy } = JSON.parse(entry);
  return [{ data, headers, status, statusText, config }, CachePolicy.fromObject(policy)];
};

export const cacheAdapter = (cache: KeyValueCache, adapter: AxiosAdapter) => async (config: AxiosRequestConfig) => {
  const { url, method, headers } = config;
  const newRequest = { url, method: String(method).toUpperCase(), headers };
  const key = cacheKey(config);
  const cached = await cache.get(key);

  if (cached) {
    const [cachedResponse, cachedPolicy] = deserialize(config, cached);
    if (cachedPolicy.satisfiesWithoutRevalidation(newRequest)) {
      return { ...cachedResponse, headers: cachedPolicy.responseHeaders() };
    }
  }

  const newResponse = await adapter(config);
  const newPolicy = new CachePolicy(newRequest, newResponse);
  if (newPolicy.storable()) {
    cache.set(key, serialize(newResponse, newPolicy), { ttl: newPolicy.timeToLive() });
  }
  return newResponse;
};
