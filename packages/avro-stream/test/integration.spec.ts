import { DateType, TimestampType } from '@ovotech/avro-logical-types';
import { idToSchema } from '@ovotech/schema-registry-api';
import { Type } from 'avsc';
import { readdirSync, readFileSync } from 'fs';
import { ConsumerGroupStream, KafkaClient, Producer, ProducerStream } from 'kafka-node';
import { join } from 'path';
import { Readable } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import * as uuid from 'uuid';
import { AvroDeserializer, AvroTopicSender, deconstructMessage } from '../src';
import { AvroSerializer } from '../src';

const createTopics = async (topics: string[]) => {
  const producer = new Producer(new KafkaClient({ kafkaHost: 'localhost:29092' }));

  await new Promise<void>(resolve => producer.on('ready', resolve));

  return await new Promise<void>((resolve, reject) =>
    producer.createTopics(topics, false, error => {
      if (error) {
        reject(error);
      } else {
        setTimeout(() => producer.close(resolve), 1000);
      }
    }),
  );
};

const stopStreamOnCount = (max: number, stream: Readable) => {
  let current = 0;
  stream.on('data', () => {
    current += 1;
    if (current >= max) {
      stream.push(null);
    }
  });
  return stream;
};

const files = readdirSync(join(__dirname, './assets'));
const sourceData = files.map(file => JSON.parse(String(readFileSync(join(__dirname, './assets', file)))));
const unqiueSourceData = sourceData.map(item => ({ ...item, topic: uuid.v4() }));
const messagesCount = sourceData.reduce((sum, item) => sum + item.messages.length, 0);
const logicalTypes = { date: DateType, 'timestamp-millis': TimestampType };

describe('Integration test', () => {
  it('Test Serialier', async () => {
    const sourceStream = new ReadableMock(sourceData, { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });

    const serializer = new AvroSerializer('http://localhost:8081', { logicalTypes });

    sourceStream.pipe(serializer).pipe(sinkStream);

    await new Promise<void>(resolve => {
      sinkStream.on('finish', async () => {
        for (const [itemIndex, item] of sinkStream.data.entries()) {
          const type = Type.forSchema(item.schema);
          for (const [messageIndex, message] of item.messages.entries()) {
            const messageParts = deconstructMessage(message);
            const schemaMessage = await idToSchema('http://localhost:8081', messageParts.schemaId);
            const content = type.fromBuffer(messageParts.buffer);

            expect(schemaMessage).toEqual(item.schema);
            expect(content).toEqual(sourceData[itemIndex].messages[messageIndex]);
          }
        }

        resolve();
      });
    });
  });

  it('Test Deserializer with kafka', async (cb) => {
    const sourceStream = new ReadableMock(unqiueSourceData, { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });
    const topics = unqiueSourceData.map(item => item.topic);
    const deserializer = new AvroDeserializer('http://localhost:8081', { logicalTypes });
    const serializer = new AvroSerializer('http://localhost:8081', { logicalTypes });

    await createTopics(topics);

    const consumerStream = new ConsumerGroupStream(
      {
        kafkaHost: 'localhost:29092',
        groupId: `integration`,
        encoding: 'buffer',
        fromOffset: 'earliest',
      },
      topics,
    );
    const producerStream = new ProducerStream({ kafkaClient: { kafkaHost: 'localhost:29092' } });

    stopStreamOnCount(messagesCount, consumerStream);

    consumerStream.pipe(deserializer).pipe(sinkStream);
    sourceStream.pipe(serializer).pipe(producerStream);

    await new Promise<void>(resolve => {
      sinkStream.on('finish', () => {
        for (let index = 0; index < messagesCount; index++) {
          expect(sinkStream.data[index]).toMatchSnapshot({
            topic: expect.any(String),
            timestamp: expect.any(Date),
          });
        }

        producerStream.close();
        consumerStream.close(resolve);
      });
    });
    cb()
  }, 25000);

  it('Test AvroTopicSender with kafka', async (cb) => {
    const topic = uuid.v4();
    const sender = new AvroTopicSender<{ accountId: string }>({
      topic,
      partition: 0,
      schema: {
        type: 'record',
        name: 'TestSchema1',
        fields: [{ name: 'accountId', type: 'string' }],
      },
    });
    const deserializer = new AvroDeserializer('http://localhost:8081', { logicalTypes });
    const serializer = new AvroSerializer('http://localhost:8081', { logicalTypes });

    const sinkStream = new WritableMock({ objectMode: true });
    await createTopics([topic]);

    const consumerStream = new ConsumerGroupStream(
      {
        kafkaHost: 'localhost:29092',
        groupId: `integration`,
        encoding: 'buffer',
        fromOffset: 'earliest',
      },
      topic,
    );
    const producerStream = new ProducerStream({ kafkaClient: { kafkaHost: 'localhost:29092' } });

    consumerStream.pipe(deserializer).pipe(sinkStream);
    sender.pipe(serializer).pipe(producerStream);

    stopStreamOnCount(1, consumerStream);
    sender.send({ accountId: '234' });

    await new Promise<void>(resolve => {
      sinkStream.on('finish', () => {
        expect(sinkStream.data).toEqual([
          expect.objectContaining({
            topic,
            value: { accountId: '234' },
          }),
        ]);

        producerStream.close();
        consumerStream.close(resolve);
      });
    });
    cb();
  }, 25000);
});
