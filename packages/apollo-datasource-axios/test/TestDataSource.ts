import { ApolloDataSourceConfig, AxiosDataSource } from '../src';

export interface AdditionalConfig extends ApolloDataSourceConfig {
  dataSourceVersion: string;
}

export class TestDataSource extends AxiosDataSource<AdditionalConfig> {
  users(id: string) {
    return this.get(`/users/${id}`, { dataSourceVersion: 'test' });
  }
}
