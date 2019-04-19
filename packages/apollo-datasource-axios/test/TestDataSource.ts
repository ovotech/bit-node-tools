import { AxiosDataSource, AxiosDataSourceConfig } from '../src';

export interface AdditionalConfig extends AxiosDataSourceConfig {
  dataSourceVersion: string;
}

export class TestDataSource extends AxiosDataSource<AdditionalConfig> {
  users(id: string) {
    return this.get(`/users/${id}`, { dataSourceVersion: 'test' });
  }
}
