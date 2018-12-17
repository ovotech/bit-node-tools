import { AvroProduceRequest } from '@ovotech/avro-stream';
import { execSync } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { inspect } from 'util';
import * as uuid from 'uuid';

const testTopic = uuid.v4();
const file: { [partition: number]: AvroProduceRequest } = {
  0: {
    partition: 0,
    topic: testTopic,
    key: null as any,
    schema: {
      type: 'record',
      name: 'TestSchema1',
      fields: [{ name: 'accountId', type: 'string' }],
    },
    messages: [{ accountId: '10' }, { accountId: '11' }, { accountId: '12' }],
  },
  1: {
    partition: 1,
    topic: testTopic,
    key: null as any,
    schema: {
      type: 'record',
      name: 'TestSchema1',
      fields: [{ name: 'accountId', type: 'string' }],
    },
    messages: [{ accountId: '13' }, { accountId: '14' }],
  },
};

describe('Integration test', () => {
  it('Should use cli to produce and consume some messages', async () => {
    const filename = join(tmpdir(), testTopic);
    const resultFilename = join(tmpdir(), `${testTopic}-result`);

    writeFileSync(filename, JSON.stringify(file));
    writeFileSync(resultFilename, JSON.stringify({}));

    const findMissingTopic = String(execSync(`yarn kac --config test/config.json topic ${testTopic}`));

    expect(findMissingTopic).toContain('No topic matching');

    const createTopic = String(execSync(`yarn kac --config test/config.json create-topic ${testTopic} --partitions 2`));

    expect(createTopic).toContain(`Topic created`);
    expect(createTopic).toContain(testTopic);

    const findTopic = String(execSync(`yarn kac --config test/config.json topic ${testTopic}`));

    expect(findTopic).toContain(`Metadata for ${testTopic}`);
    expect(findTopic).toContain('partition: 0');
    expect(findTopic).toContain('partition: 1');

    const produce = String(execSync(`yarn kac --config test/config.json produce ${filename}`, { timeout: 20000 }));

    expect(produce).toContain(`Produce 3 messages in 0 partition, for ${testTopic}`);
    expect(produce).toContain(`Produce 2 messages in 1 partition, for ${testTopic}`);
    expect(produce).toContain(`Finished`);

    const consume = String(execSync(`yarn kac --config test/config.json consume ${testTopic}`, { timeout: 40000 }));

    expect(consume).toContain(testTopic);
    expect(consume).toContain('Consumed 5 messages');
    expect(consume).toContain('Partition 0 : 3 messages');
    expect(consume).toContain('Partition 1 : 2 messages');

    for (const partition of Object.keys(file)) {
      for (const message of file[Number(partition)].messages) {
        expect(consume).toContain(inspect(message, false, 5));
      }
    }

    const consumeFile = String(
      execSync(`yarn kac --config test/config.json consume ${testTopic} --output-file ${resultFilename}`, {
        timeout: 40000,
      }),
    );

    expect(consumeFile).toContain(testTopic);
    expect(consumeFile).toContain('Consumed 5 messages');
    expect(consumeFile).toContain('Partition 0 : 3 messages');
    expect(consumeFile).toContain('Partition 1 : 2 messages');

    const resultFile = JSON.parse(String(readFileSync(resultFilename)));
    expect(resultFile).toMatchObject(file);

    unlinkSync(filename);
    unlinkSync(resultFilename);
  }, 200000);
});
