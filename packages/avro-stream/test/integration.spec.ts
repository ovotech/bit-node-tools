import { idToSchema } from '@ovotech/schema-registry-api';
import { Type } from 'avsc';
import { readdirSync, readFileSync } from 'fs';
import { ConsumerGroupStream, KafkaClient, Producer, ProducerStream } from 'kafka-node';
import { join } from 'path';
import { Readable } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import * as uuid from 'uuid';
import { AvroDeserializer, deconstructMessage } from '../src';
import { AvroSerializer } from '../src';
import { DateType } from './DateType';
import { TimestampType } from './TimestampType';

const createTopics = async (topics: string[]) => {
  const producer = new Producer(new KafkaClient({ kafkaHost: 'localhost:29092' }));

  await new Promise(resolve => producer.on('ready', resolve));

  return await new Promise((resolve, reject) =>
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

describe('Integration test', () => {
  it('Test Serialier', async () => {
    const sourceStream = new ReadableMock(sourceData, { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });
    const serializer = new AvroSerializer('http://localhost:8081', {
      logicalTypes: { date: DateType, 'timestamp-millis': TimestampType },
    });

    sourceStream.pipe(serializer).pipe(sinkStream);

    await new Promise(resolve => {
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

  it('Test Deserializer with kafka', async () => {
    const sourceStream = new ReadableMock(unqiueSourceData, { objectMode: true });
    const sinkStream = new WritableMock({ objectMode: true });
    const topics = unqiueSourceData.map(item => item.topic);

    const deserializer = new AvroDeserializer('http://localhost:8081', {
      logicalTypes: { date: DateType, 'timestamp-millis': TimestampType },
    });
    const serializer = new AvroSerializer('http://localhost:8081', {
      logicalTypes: { date: DateType, 'timestamp-millis': TimestampType },
    });

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

    await new Promise(resolve => {
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
  }, 15000);
});
