export interface Message<TValue = any> {
  topic: string;
  value: TValue;
  offset?: number;
  partition?: number;
  highWaterOffset?: number;
  key?: string;
}
