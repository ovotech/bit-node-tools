import { Type, types } from 'avsc';
/**
 * Custom logical type used to encode native Date objects as int.
 */

const millisecondsInADay = 8.64e7;

export class DateType extends types.LogicalType {
  _fromValue(val: number) {
    return new Date(val * millisecondsInADay).toISOString();
  }
  _toValue(date: any) {
    return date instanceof Date ? Math.floor(date.getTime() / millisecondsInADay) : date;
  }
  _resolve(type: any) {
    if (Type.isType(type, 'int', 'logical:date')) {
      return this._fromValue;
    }
    return undefined;
  }
}
