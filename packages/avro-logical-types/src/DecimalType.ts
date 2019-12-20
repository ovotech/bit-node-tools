import { Type, types } from 'avsc';
import { Decimal } from 'decimal.js';
import { Int64BE } from 'int64-buffer';

export class DecimalType extends types.LogicalType {
  public precision: number;
  public scale: number;

  constructor(schema: any, opts?: any) {
    super(schema, opts);
    this.precision = schema.precision;
    this.scale = schema.scale;
  }

  public _export(attrs: any) {
    attrs.precision = this.precision;
    attrs.scale = this.scale;
  }

  public _resolve(type: Type) {
    if (
      type instanceof DecimalType &&
      Type.isType(type, 'logical:decimal') &&
      type.precision === this.precision &&
      type.scale === this.scale
    ) {
      return <T>(x: T): T => x;
    }
  }

  public _fromValue(buf: any) {
    if (!(buf instanceof Buffer)) {
      throw new Error('expecting underlying Buffer type');
    }

    if (buf.length > 8) {
      throw new Error('buffers with more than 64bits are not supported');
    }

    return bufferToDecimal(buf, this.scale);
  }

  public _toValue(val: any) {
    if (!(val instanceof Decimal)) {
      throw new Error('expecting Decimal type');
    }

    return decimalToBuffer(val, this.scale);
  }
}

export function decimalToBuffer(val: Decimal, scale: number): Buffer {
  const scaled = val.mul(10 ** scale);
  const value = new Int64BE(scaled.trunc().toString());
  return value.toBuffer();
}

export function bufferToDecimal(buf: Buffer, scale: number): Decimal {
  const unscaled = new Int64BE(to64Bit(buf));
  return new Decimal(unscaled.toString()).div(10 ** scale);
}

export function to64Bit(buf: Buffer) {
  // tslint:disable-next-line:no-bitwise
  const isNegatve = buf[0] & 0x80;
  const toFill = 8 - buf.length;

  const bufferElements = Array.prototype.slice.call(buf, 0);

  return Buffer.from([...[...new Array(toFill)].map(_ => (isNegatve ? 0xff : 0x00)), ...bufferElements]);
}
