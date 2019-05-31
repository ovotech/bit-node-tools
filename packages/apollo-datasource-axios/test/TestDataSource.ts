import { AxiosDataSource } from '../src';

export class TestDataSource extends AxiosDataSource {
  users(id: string) {
    return this.get(`/users/${id}`);
  }
}
