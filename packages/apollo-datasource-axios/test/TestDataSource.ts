import { AxiosRequestConfig } from 'axios';
import { AxiosDataSource } from '../src/AxiosDataSource';

interface AdditionalConfig {
  dataSourceVersion: string;
}

export class TestDataSource extends AxiosDataSource<any, AdditionalConfig> {
  users(id: string) {
    return this.get(`/users/${id}`, { dataSourceVersion: 'test' });
  }
}
