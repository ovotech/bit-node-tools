import { DataSource, DataSourceConfig } from 'apollo-datasource';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheAdapter } from './cacheAdapter';

export interface Interceptor {
  request?: {
    onFulfilled?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
    onRejected?: (error: any) => any;
  };
  response?: {
    onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
    onRejected?: (error: any) => any;
  };
}

export abstract class AxiosDataSource extends DataSource {
  api: AxiosInstance;

  constructor(protected config: AxiosRequestConfig & { interceptors?: Interceptor[] } = {}) {
    super();
    const { interceptors, ...axiosConfig } = config;

    this.api = axios.create(axiosConfig);

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

  async request(config: AxiosRequestConfig) {
    try {
      return await this.api.request(config);
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

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.request({ url, method: 'get', ...config });
  }

  delete(url: string, config?: AxiosRequestConfig) {
    return this.request({ url, method: 'delete', ...config });
  }

  head(url: string, config?: AxiosRequestConfig) {
    return this.request({ url, method: 'head', ...config });
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request({ url, data, method: 'post', ...config });
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request({ url, data, method: 'put', ...config });
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request({ url, data, method: 'patch', ...config });
  }
}
