import { filterSearch } from '../src/';

describe('schema test', () => {
  it.each<[string, string | undefined, string[], string[]]>([
    ['no search', undefined, ['test', 'other', 'different'], ['test', 'other', 'different']],
    ['single match', 'test', ['test', 'other', 'different'], ['test']],
    ['exact match', 'test', ['test', 'test-2', 'other', 'different'], ['test']],
    ['multiple partial matches', 'test', ['test-1', 'test-2', 'other', 'different'], ['test-1', 'test-2']],
    ['no matches', 'unknown', ['test', 'other', 'different'], []],
  ])('Should filter when %s', (_, search, list, expected) => {
    expect(filterSearch(search, list)).toEqual(expected);
  });
});
