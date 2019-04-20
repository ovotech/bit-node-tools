import { DataSource, DataSourceConfig } from 'apollo-datasource';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import axios, { AxiosError, AxiosInstance, AxiosInterceptorManager, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheAdapter } from './cacheAdapter';

export interface ApolloAxiosInstance<TConfig extends AxiosRequestConfig = AxiosRequestConfig> extends AxiosInstance {
  (config: TConfig): ApolloAxiosResponse<any, TConfig>;
  (url: string, config?: TConfig): ApolloAxiosResponse<any, TConfig>;
  defaults: TConfig;
  interceptors: {
    request: AxiosInterceptorManager<TConfig>;
    response: AxiosInterceptorManager<ApolloAxiosResponse<any, TConfig>>;
  };
  request<T = any>(config: TConfig): ApolloAxiosPromise<T, TConfig>;
  get<T = any>(url: string, config?: TConfig): ApolloAxiosPromise<T, TConfig>;
  delete(url: string, config?: TConfig): ApolloAxiosPromise<any, TConfig>;
  head(url: string, config?: TConfig): ApolloAxiosPromise<any, TConfig>;
  post<T = any>(url: string, data?: any, config?: TConfig): ApolloAxiosPromise<T, TConfig>;
  put<T = any>(url: string, data?: any, config?: TConfig): ApolloAxiosPromise<T, TConfig>;
  patch<T = any>(url: string, data?: any, config?: TConfig): ApolloAxiosPromise<T, TConfig>;
}

export interface ApolloAxiosResponse<T = any, TConfig extends AxiosRequestConfig = AxiosRequestConfig>
  extends AxiosResponse<T> {
  config: TConfig;
}

export interface ApolloAxiosPromise<T = any, TConfig extends AxiosRequestConfig = AxiosRequestConfig>
  extends Promise<ApolloAxiosResponse<T, TConfig>> {}

export interface Interceptor<T = AxiosRequestConfig, TT = ApolloAxiosResponse<any, T>> {
  request?: {
    onFulfilled?: (config: T) => T | Promise<T>;
    onRejected?: (error: any) => any;
  };
  response?: {
    onFulfilled?: (response: TT) => TT | Promise<TT>;
    onRejected?: (error: any) => any;
  };
}

export abstract class AxiosDataSource<TConfig extends AxiosRequestConfig = AxiosRequestConfig> extends DataSource {
  api: ApolloAxiosInstance<TConfig>;

  constructor(protected config: AxiosRequestConfig & { interceptors?: Array<Interceptor<TConfig>> } = {}) {
    super();
    const { interceptors, ...axiosConfig } = config;

    this.api = axios.create(axiosConfig) as ApolloAxiosInstance<TConfig>;

    if (interceptors) {
      interceptors.forEach(({ request, response }) => {
        if (request) {
          this.api.interceptors.request.use(request.onFulfilled, request.onRejected);
        }
        if (response) {
          this.api.interceptors.response.use(response.onFulfilled, response.onRejected);
        }
      });
    }
  }

  initialize(config: DataSourceConfig<any>): void {
    this.api.defaults.adapter = cacheAdapter(config.cache, this.api.defaults.adapter!);
  }

  async request<T = any>(config: TConfig) {
    try {
      return await this.api.request<T>(config);
    } catch (error) {
      if (error.response) {
        const {
          status,
          statusText,
          config: { url, params, method },
          data,
        } = (error as AxiosError).response!;

        const message = `${status}: ${statusText}`;
        const apolloError =
          status === 401
            ? new AuthenticationError(message)
            : status === 403
            ? new ForbiddenError(message)
            : new ApolloError(message, error.code);

        apolloError.extensions = {
          ...apolloError.extensions,
          response: { url, params, method, status, statusText, data },
        };

        throw apolloError;
      } else if (error.config) {
        const { url, method, params, data } = error.config;
        const apolloError = new ApolloError(error.message, error.code);
        apolloError.extensions = { ...apolloError.extensions, request: { url, params, method, data } };

        throw apolloError;
      } else {
        throw error;
      }
    }
  }

  get<T = any>(url: string, config?: TConfig) {
    return this.request<T>({ url, method: 'get', ...config } as TConfig);
  }

  delete(url: string, config?: TConfig) {
    return this.request({ url, method: 'delete', ...config } as TConfig);
  }

  head(url: string, config?: TConfig) {
    return this.request({ url, method: 'head', ...config } as TConfig);
  }

  post<T = any>(url: string, data?: any, config?: TConfig) {
    return this.request<T>({ url, data, method: 'post', ...config } as TConfig);
  }

  put<T = any>(url: string, data?: any, config?: TConfig) {
    return this.request<T>({ url, data, method: 'put', ...config } as TConfig);
  }

  patch<T = any>(url: string, data?: any, config?: TConfig) {
    return this.request<T>({ url, data, method: 'patch', ...config } as TConfig);
  }
}
