import { Schema, Type } from 'avsc';
import { constructMessage, deconstructMessage } from '../src';

const schemas: { [key: number]: Schema } = {
  1: {
    type: 'record',
    name: 'TestSchema1',
    fields: [{ name: 'accountId', type: 'string' }],
  } as Schema,
  2: {
    type: 'record',
    name: 'TestSchema2',
    fields: [{ name: 'effectiveEnrollmentDate', type: { type: 'int', logicalType: 'date' } }],
  } as Schema,
};

describe('AvroDeserializer test', () => {
  it.each`
    constructed                                   | id   | buffer
    ${new Buffer([0, 0, 0, 0, 1, 6, 49, 49, 49])} | ${1} | ${{ accountId: '111' }}
    ${new Buffer([0, 0, 0, 0, 1, 6, 50, 50, 50])} | ${1} | ${{ accountId: '222' }}
    ${new Buffer([0, 0, 0, 0, 2, 174, 148, 2])}   | ${2} | ${{ effectiveEnrollmentDate: 17687 }}
    ${new Buffer([0, 0, 0, 0, 2, 190, 146, 2])}   | ${2} | ${{ effectiveEnrollmentDate: 17567 }}
  `('deconstructMessage', ({ constructed, id, buffer }) => {
    const avroMessage = {
      schemaId: id,
      buffer: Type.forSchema(schemas[id]).toBuffer(buffer),
    };

    expect(deconstructMessage(constructed)).toEqual(avroMessage);
    expect(constructMessage(avroMessage)).toEqual(constructed);
  });
});
