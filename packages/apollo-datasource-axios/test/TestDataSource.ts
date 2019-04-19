import { ApolloDataSourceConfig, AxiosDataSource } from '../src';

interface AdditionalConfig extends ApolloDataSourceConfig {
  dataSourceVersion: string;
}

export class TestDataSource extends AxiosDataSource<AdditionalConfig> {
  users(id: string) {
    return this.get(`/users/${id}`, { dataSourceVersion: 'test' });
  }
}
