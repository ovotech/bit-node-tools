import { Migration } from './types';

export class MigrationError extends Error {
  constructor(message: string | undefined, public migration: Migration) {
    super(message);
  }
}
