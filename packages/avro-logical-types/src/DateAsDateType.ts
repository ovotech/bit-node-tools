import { Type, types } from 'avsc';
import { toDate, fromDate } from './helpers/epoch-days';

/**
 * Custom logical type used to encode native Date objects as int.
 */
export class DateAsDateType extends types.LogicalType {
  _fromValue(val: number) {
    return toDate(val);
  }
  _toValue(date: any) {
    return fromDate(date);
  }
  _resolve(type: any) {
    if (Type.isType(type, 'int', 'logical:date')) {
      return this._fromValue;
    }
    return undefined;
  }
}
