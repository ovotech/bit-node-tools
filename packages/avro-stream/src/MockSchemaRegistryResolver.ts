import { AvroProduceRequest, SchemaResolver } from './types';

export class MockSchemaRegistryResolver implements SchemaResolver {
  constructor(public readonly requests: AvroProduceRequest[]) {}

  async toId(topic: string) {
    return this.requests.findIndex(request => request.topic === topic);
  }

  async fromId(id: number) {
    return this.requests[id].schema;
  }
}
