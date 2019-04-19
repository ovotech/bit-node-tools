import { DataSource, DataSourceConfig } from 'apollo-datasource';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-errors';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosInterceptorManager,
  AxiosPromise,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { cacheAdapter } from './cacheAdapter';

export interface RequestInterceptor<V = AxiosRequestConfig> {
  onFulfilled?: (value: V) => V | Promise<V>;
  onRejected?: (error: any) => any;
}
export interface ResponseInterceptor<V = AxiosResponse> {
  onFulfilled?: (value: V) => V | Promise<V>;
  onRejected?: (error: any) => any;
}

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

export interface ApolloDataSourceConfig extends AxiosRequestConfig {
  context?: any;
}

export abstract class AxiosDataSource<
  TConfig extends ApolloDataSourceConfig = ApolloDataSourceConfig
> extends DataSource {
  api: ApolloAxiosInstance<TConfig>;

  constructor(
    protected config: ApolloDataSourceConfig = {},
    options?: {
      request?: Array<RequestInterceptor<TConfig>>;
      response?: Array<ResponseInterceptor<ApolloAxiosResponse<any, TConfig>>>;
    },
  ) {
    super();
    this.api = axios.create(config) as ApolloAxiosInstance<TConfig>;
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

  initialize(config: DataSourceConfig<any>): void {
    this.api.defaults.adapter = cacheAdapter(config.cache, this.api.defaults.adapter!);
    this.api.defaults.context = config.context;
  }

  async request<T = any>(config: TConfig) {
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
