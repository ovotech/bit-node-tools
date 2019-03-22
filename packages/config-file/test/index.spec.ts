import { join } from 'path';
import { loadConfigFile, resolveValues } from '../src';

const envConfig = join(__dirname, 'env.config.json');
const fullConfig = join(__dirname, 'full.config.json');
const partialConfig = join(__dirname, 'partial.config.json');
const emptyConfig = join(__dirname, 'empty.config.json');

interface ConfigType {
  test1: string;
  test2: string;
}

describe('Config File', () => {
  it.each<
    [
      string,
      { value1: string; value2: string },
      { TEST_1?: string; TEST_2?: string },
      { value1: string; value2: string }
    ]
  >([
    ['nothing to resolve', { value1: '123', value2: '111' }, {}, { value1: '123', value2: '111' }],
    [
      'one variable',
      { value1: '123-${TEST_1}-11', value2: '${TEST_1}' },
      { TEST_1: 'aa' },
      { value1: '123-aa-11', value2: 'aa' },
    ],
    [
      'multiple variables',
      { value1: '123-${TEST_2}-11', value2: '${TEST_1}' },
      { TEST_1: 'aa', TEST_2: 'bb' },
      { value1: '123-bb-11', value2: 'aa' },
    ],
    [
      'multiple variables in one string',
      { value1: '123-${TEST_1}-11-${TEST_2}', value2: '${TEST_1}' },
      { TEST_1: 'aa', TEST_2: 'bb' },
      { value1: '123-aa-11-bb', value2: 'aa' },
    ],
    [
      'missing variables',
      { value1: '123-${TEST_1}-11', value2: '${TEST_1}' },
      {},
      { value1: '123-undefined-11', value2: 'undefined' },
    ],
  ])('Should resolve environment variables for %s', async (name, config, env, expected) => {
    expect(resolveValues(config, env)).toEqual(expected);
  });

  it('Test loading a full config', () => {
    const result = loadConfigFile<ConfigType>({ env: {}, file: fullConfig });
    expect(result).toEqual({ test1: 'val1', test2: 'val2' });
  });

  it('Test loading a config and resolve env variables', () => {
    const result = loadConfigFile<ConfigType>({ env: { TEST_1: 'aa', TEST_2: 'bb' }, file: envConfig });
    expect(result).toEqual({ test1: 'aa', test2: 'aa-bb-aa' });
  });

  it('Test loading a config with defaults', () => {
    const result = loadConfigFile<ConfigType>({
      env: {},
      file: partialConfig,
      defaults: { test1: '111', test2: '222' },
    });

    expect(result).toEqual({ test1: '111', test2: 'val2' });
  });

  it('Test loading a config with a missing keys', () => {
    expect(() => loadConfigFile<ConfigType>({ env: {}, file: partialConfig, required: ['test1'] })).toThrowError(
      'Configuration should include "test1" in',
    );
  });

  it('Test loading a config with multiple missing keys', () => {
    expect(() => loadConfigFile<ConfigType>({ env: {}, file: emptyConfig, required: ['test1', 'test2'] })).toThrowError(
      'Configuration should include "test1", "test2" in',
    );
  });
});
