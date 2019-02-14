export interface Message {
  topic: string;
  value: any;
  offset?: number;
  partition?: number;
  highWaterOffset?: number;
  key?: string;
}
