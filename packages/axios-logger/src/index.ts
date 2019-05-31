import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface AxiosLogger {
  redact?: string[];
  requestStartedAt?: Date;
}

export interface LogMeta {
  uri?: string;
  method?: string;
  requestBody?: any;
  responseBody?: any;
  params: any;
  status: number;
  responseTime: number;
}

export const startHeader = 'X-Request-Started';
export const redactHeader = 'X-Redact-Log';

const redactPath = (path: string[], obj: any): any => {
  const [current, ...rest] = path;

  return current === '*' && Array.isArray(obj)
    ? obj.map(item => redactPath(rest, item))
    : obj[current]
    ? { ...obj, [current]: rest.length ? redactPath(rest, obj[current]) : '<Removed>' }
    : obj;
};

const defaultRedact = ['requestBody', 'uri', 'params', 'responseBody'];

export const redactPaths = (paths: string[], object: any) =>
  paths.reduce((current, path) => redactPath(path.split('.'), current), object);

export const getMeta = (response: AxiosResponse): LogMeta => {
  const { url: uri, data, params, method, headers } = response.config;
  const { data: responseBody, status } = response;
  const requestBody = data === undefined ? undefined : JSON.parse(data);
  const responseTime = headers[startHeader] ? new Date().getTime() - headers[startHeader].getTime() : undefined;
  const meta = { uri, method, requestBody, responseBody, params, status, responseTime };

  return redactPaths(
    headers[redactHeader] ? headers[redactHeader].split(',').map((path: string) => path.trim()) : defaultRedact,
    meta,
  );
};

export const axiosLogger = (log: (level: 'info' | 'error', meta: LogMeta, config: AxiosRequestConfig) => void) => ({
  request: {
    onFulfilled: (config: AxiosRequestConfig): AxiosRequestConfig => ({
      ...config,
      headers: {
        ...config.headers,
        [startHeader]: config.headers[startHeader] || new Date(),
      },
    }),
  },
  response: {
    onFulfilled: (response: AxiosResponse) => {
      log('info', getMeta(response), response.config);
      return response;
    },
    onRejected: (error: AxiosError) => {
      if (error.response) {
        const { responseBody, ...meta } = getMeta(error.response);
        log('error', meta, error.config);
      }
      return Promise.reject(error);
    },
  },
});
