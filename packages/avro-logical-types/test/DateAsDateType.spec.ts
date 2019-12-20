import { Schema, Type } from 'avsc';
import { DateAsDateType } from '../src';

describe('Unit test', () => {
  it('DateAsDateType', async () => {
    const type = Type.forSchema(
      {
        type: 'record',
        fields: [{ name: 'startedAt', type: { type: 'int', logicalType: 'date' } }],
      } as Schema,
      { logicalTypes: { date: DateAsDateType } },
    );

    const values = [{ startedAt: new Date('2018-06-05') }, { startedAt: 17687 }];
    const expected = [
      { startedAt: new Date('2018-06-05T00:00:00.000Z') },
      { startedAt: new Date('2018-06-05T00:00:00.000Z') },
    ];

    const buffers = values.map(value => type.toBuffer(value));
    const converted = buffers.map(buffer => type.fromBuffer(buffer));

    expect(buffers[0]).toEqual(buffers[1]);
    expect(converted).toEqual(expected);
    expect(buffers).toMatchSnapshot();
  });

  it('Test resolve from int', () => {
    const type = Type.forSchema(
      {
        type: 'record',
        fields: [{ name: 'startedAt', type: { type: 'int', logicalType: 'date' } }],
      } as Schema,
      { logicalTypes: { date: DateAsDateType } },
    );

    const longType = Type.forSchema({
      type: 'record',
      fields: [{ name: 'startedAt', type: 'int' }, { name: 'name', type: 'string' }],
    } as Schema);

    const expected = { startedAt: new Date('2018-06-05T00:00:00.000Z') };
    const longBuffer = longType.toBuffer({ startedAt: 17687, name: 'test' });
    const resolver = type.createResolver(longType);
    const value = type.fromBuffer(longBuffer, resolver);

    expect(value).toEqual(expected);
  });

  it('Test invalid resolver', () => {
    const type = Type.forSchema(
      {
        type: 'record',
        fields: [{ name: 'startedAt', type: { type: 'int', logicalType: 'date' } }],
      } as Schema,
      { logicalTypes: { date: DateAsDateType } },
    );

    const longType = Type.forSchema({
      type: 'record',
      fields: [{ name: 'startedAt', type: 'string' }],
    } as Schema);

    expect(() => type.createResolver(longType)).toThrowError();
  });
});
