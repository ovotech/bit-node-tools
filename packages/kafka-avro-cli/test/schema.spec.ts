import { addSubjectVersion } from '@ovotech/schema-registry-api';
import { Schema } from 'avsc';
import { execSync } from 'child_process';
import { inspect } from 'util';
import * as uuid from 'uuid';
import { loadConfig } from '../src/cli/config';

const schemas = [
  {
    type: 'record',
    name: 'TestSchema1',
    fields: [{ name: 'accountId', type: 'string' }],
  } as Schema,
  {
    type: 'record',
    name: 'TestSchema2',
    fields: [{ name: 'effectiveEnrollmentDate', type: { type: 'int', logicalType: 'date' } }],
  } as Schema,
];

describe('schema test', () => {
  it('Should use schema command to retrieve schema data', async () => {
    const subjects = [`tmp-${uuid.v4()}`, `tmp-2-${uuid.v4()}`, uuid.v4()];
    const { schemaRegistry } = loadConfig({ config: 'test/config.json' });

    await addSubjectVersion(schemaRegistry!, subjects[0], schemas[0]);
    await addSubjectVersion(schemaRegistry!, subjects[1], schemas[0]);
    await addSubjectVersion(schemaRegistry!, subjects[2], schemas[1]);

    const allResults = String(execSync('yarn kac --config test/config.json schema'));
    const tmpResults = String(execSync('yarn kac --config test/config.json schema tmp'));
    const singleResult = String(execSync(`yarn kac --config test/config.json schema ${subjects[2]}`));

    expect(allResults).toContain(subjects[0]);
    expect(allResults).toContain(subjects[1]);
    expect(allResults).toContain(subjects[2]);

    expect(tmpResults).toContain(subjects[0]);
    expect(tmpResults).toContain(subjects[1]);
    expect(tmpResults).not.toContain(subjects[2]);

    expect(singleResult).toContain(subjects[2]);
    expect(singleResult).toContain(inspect(schemas[1], false, 7));
  });
});
