import { DataSource, DataSourceConfig } from 'apollo-datasource';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheAdapter } from './cacheAdapter';

export interface RequestInterceptor<V = AxiosRequestConfig> {
  onFulfilled?: (value: V) => V | Promise<V>;
  onRejected?: (error: any) => any;
}
export interface ResponseInterceptor<V = AxiosResponse> {
  onFulfilled?: (value: V) => V | Promise<V>;
  onRejected?: (error: any) => any;
}

export abstract class AxiosDataSource<TContext = any> extends DataSource {
  api: AxiosInstance;

  constructor(
    protected config: AxiosRequestConfig = {},
    options?: { request?: RequestInterceptor[]; response?: ResponseInterceptor[] },
  ) {
    super();
    this.api = axios.create(config);
    if (options) {
      const { request, response } = options;
      if (request) {
        request.forEach(({ onFulfilled, onRejected }) => this.api.interceptors.request.use(onFulfilled, onRejected));
      }
      if (response) {
        response.forEach(({ onFulfilled, onRejected }) => this.api.interceptors.response.use(onFulfilled, onRejected));
      }
    }
  }

  initialize(config: DataSourceConfig<TContext>): void {
    this.api.defaults.adapter = cacheAdapter(config.cache, this.api.defaults.adapter!);
  }

  async request<T = any>(config: AxiosRequestConfig) {
    try {
      return await this.api.request<T>(config);
    } catch (error) {
      if (error.response) {
        const {
          status,
          statusText,
          config: { url },
          data,
        } = (error as AxiosError).response!;

        const message = `${status}: ${statusText}`;
        const apolloError =
          status === 401
            ? new AuthenticationError(message)
            : status === 403
            ? new ForbiddenError(message)
            : new ApolloError(message, error.code);

        apolloError.extensions = { ...apolloError.extensions, response: { url, status, statusText, data } };

        throw apolloError;
      } else {
        throw error;
      }
    }
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ url, method: 'get', ...config });
  }

  delete(url: string, config?: AxiosRequestConfig) {
    return this.request({ url, method: 'delete', ...config });
  }

  head(url: string, config?: AxiosRequestConfig) {
    return this.request({ url, method: 'head', ...config });
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>({ url, data, method: 'post', ...config });
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>({ url, data, method: 'put', ...config });
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>({ url, data, method: 'patch', ...config });
  }
}
