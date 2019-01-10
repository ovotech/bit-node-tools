import { Type, types } from 'avsc';
/**
 * Custom logical type used to encode native Date objects as long.
 */
export class TimestampType extends types.LogicalType {
  _fromValue(val: number) {
    return new Date(val).toISOString();
  }
  _toValue(date: any) {
    return date instanceof Date ? date.getTime() : date;
  }
  _resolve(type: any) {
    if (Type.isType(type, 'long', 'logical:timestamp-millis')) {
      return this._fromValue;
    }
    return undefined;
  }
}
