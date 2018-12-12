export class SchemaRegistryError extends Error {
  constructor(message: string, public code: number) {
    super(message);
  }
}
