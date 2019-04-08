import { AxiosDataSource } from '../src/AxiosDataSource';

export class TestDataSource extends AxiosDataSource {
  users(id: string) {
    return this.get(`/users/${id}`);
  }
}
