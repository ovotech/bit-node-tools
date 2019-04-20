import { AxiosRequestConfig } from 'axios';
import { AxiosDataSource } from '../src';

export interface AdditionalConfig extends AxiosRequestConfig {
  dataSourceVersion: string;
}

export class TestDataSource extends AxiosDataSource<AdditionalConfig> {
  users(id: string) {
    return this.get(`/users/${id}`, { dataSourceVersion: 'test' });
  }
}
