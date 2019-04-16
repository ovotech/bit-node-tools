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

export interface WithLogger extends AxiosRequestConfig, AxiosLogger {}

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
  const { redact, url: uri, data, params, method, requestStartedAt }: WithLogger = response.config;
  const { data: responseBody, status } = response;
  const requestBody = data === undefined ? undefined : JSON.parse(data);
  const responseTime = requestStartedAt ? new Date().getTime() - requestStartedAt.getTime() : undefined;
  const meta = { uri, method, requestBody, responseBody, params, status, responseTime };

  return redactPaths(redact || defaultRedact, meta);
};

export const axiosLogger = (log: (level: 'info' | 'error', meta: LogMeta) => void) => ({
  request: {
    onFullfilled: (config: WithLogger) => ({ ...config, requestStartedAt: config.requestStartedAt || new Date() }),
  },
  response: {
    onFullfilled: (response: AxiosResponse) => {
      log('info', getMeta(response));
      return response;
    },
    onRejected: (error: AxiosError) => {
      if (error.response) {
        const { responseBody, ...meta } = getMeta(error.response);
        log('error', meta);
      }
      return Promise.reject(error);
    },
  },
});
