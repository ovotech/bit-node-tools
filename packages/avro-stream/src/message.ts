export interface AvroMessage {
  schemaId: number;
  buffer: Buffer;
}

export const deconstructMessage = (buffer: Buffer): AvroMessage => {
  return { schemaId: buffer.readInt32BE(1), buffer: buffer.slice(5) };
};

export const constructMessage = ({ schemaId, buffer }: AvroMessage): Buffer => {
  const prefix = Buffer.alloc(5);
  prefix.writeUInt8(0, 0);
  prefix.writeUInt32BE(schemaId, 1);

  return Buffer.concat([prefix, buffer]);
};
