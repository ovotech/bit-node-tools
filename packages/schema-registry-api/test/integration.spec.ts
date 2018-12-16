import { Schema } from 'avsc';
import { FetchError } from 'node-fetch';
import * as uuid from 'uuid';
import {
  addSubjectVersion,
  checkCompatibility,
  checkSubjectRegistered,
  deleteSubject,
  deleteSubjectVersion,
  getSchema,
  getSubjects,
  getSubjectVersions,
  getSubjectVersionSchema,
  idToSchema,
  schemaToId,
  toSubject,
} from '../src';
import { SchemaRegistryError } from '../src/SchemaRegistryError';

const schema1: Schema = {
  type: 'record',
  name: 'TestSchema',
  fields: [{ name: 'accountId', type: 'string' }],
};

const schema2: Schema = {
  type: 'record',
  name: 'AccountMigrationScheduledEvent',
  fields: [{ name: 'effectiveEnrollmentDate', type: { type: 'int', logicalType: 'date' } }],
} as Schema;

const schema3: Schema = {
  type: 'record',
  name: 'AccountMigrationScheduledEvent',
  fields: [
    {
      name: 'effectiveEnrollmentDate',
      type: { type: 'int', logicalType: 'date' },
      doc: 'When the migratino is estimated to be finished',
    },
  ],
} as Schema;

const baseUrl = 'http://localhost:8081';
let subject = '';

describe('Integration test', () => {
  it.each`
    topic             | expected
    ${'test'}         | ${'test-value'}
    ${'test-another'} | ${'test-another-value'}
  `('toSubject should give subject $expected for $topic', ({ topic, expected }) => {
    expect(toSubject(topic)).toEqual(expected);
  });

  beforeEach(() => {
    subject = uuid.v4();
  });

  it('Create and delete subjects and schemas', async () => {
    const initialSubjects = await getSubjects(baseUrl);
    expect(initialSubjects).not.toContain(subject);

    const newVersion = await addSubjectVersion(baseUrl, subject, schema1);
    expect(newVersion).toEqual({ id: expect.any(Number) });

    const idSchema = await getSchema(baseUrl, newVersion.id);
    expect(idSchema).toEqual({ schema: JSON.stringify(schema1) });

    const versions = await getSubjectVersions(baseUrl, subject);
    expect(versions).toEqual([1]);

    const subjects = await getSubjects(baseUrl);
    expect(subjects).toContain(subject);

    const deleteSubjectResult = await deleteSubject(baseUrl, subject);
    expect(deleteSubjectResult).toEqual([1]);

    const finalSubjects = await getSubjects(baseUrl);
    expect(finalSubjects).not.toContain(subject);
  });

  it('Test check existing', async () => {
    const checkForEmpty = checkSubjectRegistered(baseUrl, subject, schema1);
    await expect(checkForEmpty).rejects.toEqual(new SchemaRegistryError('Subject not found.', 40401));

    const newVersion = await addSubjectVersion(baseUrl, subject, schema1);

    const notExistingCheck = checkSubjectRegistered(baseUrl, subject, schema2);
    await expect(notExistingCheck).rejects.toEqual(new SchemaRegistryError('Schema not found', 40401));

    const existingCheck = await checkSubjectRegistered(baseUrl, subject, schema1);
    expect(existingCheck).toEqual({ id: newVersion.id, subject, version: 1, schema: JSON.stringify(schema1) });

    await deleteSubject(baseUrl, subject);
  });

  it('Test idToSchema', async () => {
    const newVersion = await addSubjectVersion(baseUrl, subject, schema1);

    const foundSchema = await idToSchema(baseUrl, newVersion.id);
    expect(foundSchema).toEqual(schema1);

    await deleteSubject(baseUrl, subject);
  });

  it('Test schemaToId existing', async () => {
    const newVersion = await addSubjectVersion(baseUrl, subject, schema1);

    const foundId = await schemaToId(baseUrl, subject, schema1);
    expect(foundId).toEqual(newVersion.id);

    await deleteSubject(baseUrl, subject);
  });

  it('Test schemaToId create new', async () => {
    const createdId = await schemaToId(baseUrl, subject, schema2);
    expect(createdId).toEqual(expect.any(Number));

    const subjects = await getSubjects(baseUrl);
    expect(subjects).toContain(subject);

    const createdSchema = await getSchema(baseUrl, createdId);
    expect(createdSchema).toEqual({ schema: JSON.stringify(schema2) });

    const normalError = schemaToId('http://example.com', subject, schema1);
    await expect(normalError).rejects.toEqual(expect.any(FetchError));

    const incompatibleSchema = schemaToId(baseUrl, subject, schema1);
    await expect(incompatibleSchema).rejects.toEqual(
      new Error('Schema being registered is incompatible with an earlier schema'),
    );

    const newVersionId = await schemaToId(baseUrl, subject, schema3);
    expect(newVersionId).toEqual(expect.any(Number));

    const createdVersion = await getSubjectVersionSchema(baseUrl, subject, 2);
    expect(createdVersion).toEqual(schema3);

    await deleteSubject(baseUrl, subject);
  });

  it('Test delete version', async () => {
    await addSubjectVersion(baseUrl, subject, schema1);

    const deleteVersionResult = await deleteSubjectVersion(baseUrl, subject, 1);
    expect(deleteVersionResult).toEqual(1);

    const deletedSchemaVersion = getSubjectVersionSchema(baseUrl, subject, 1);
    expect(deletedSchemaVersion).rejects.toEqual(new SchemaRegistryError('Subject not found.', 40402));
  });

  it('Test compatibility', async () => {
    await addSubjectVersion(baseUrl, subject, schema1);

    const invalidVersionCompat = checkCompatibility(baseUrl, subject, 3, schema1);
    expect(invalidVersionCompat).rejects.toEqual(new SchemaRegistryError('Version not found.', 40402));

    const noComapt = await checkCompatibility(baseUrl, subject, 1, schema2);
    expect(noComapt).toEqual({ is_compatible: false });

    const comapt = await checkCompatibility(baseUrl, subject, 1, schema1);
    expect(comapt).toEqual({ is_compatible: true });

    await deleteSubject(baseUrl, subject);
  });
});
