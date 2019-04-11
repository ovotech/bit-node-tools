# BigQuery PG Sink

Stream the results of query made by [nodejs-bigquery](https://github.com/googleapis/nodejs-bigquery) into a postgres database.

### Using

```bash
yarn add @ovotech/bigquery-pg-sink
```

```typescript
import { BigQueryPGSinkStream } from '@ovotech/bigquery-pg-sink';
import { Client } from 'pg';

// Example insert function
export const insertQuery = (table: string, rows: ExportRow[]): [string, any[]] => {
  const query = rows
    .map(
      (_, rowIndex) =>
        `(${columns
          .map((row: ExportRow, index) => `$${index + 1 + rowIndex * 2}`)
          .join(',')})`,
    )
    .join(',');


  const flatRows = rows
    .map(row => [
      row.id,
      row.record,
    ])
    .reduce((acc, val) => acc.concat(val), []);

  return [
    `INSERT INTO ${table}
      (
        id,
        record,
      ) VALUES ${query}`,
    flatRows,
  ];
};

const pg = new Client('postgresql://postgres:dev-pass@0.0.0.0:5432/postgres');
const pgSink = new BigQueryPGSinkStream({
  pg: db,
  table: 'NAME_OF_TABLE_IN_DATABASE',
  insert: insertQuery,
});

bigquery
    .createQueryStream('___BIGQUERY_QUERY_STRING___')
    .pipe(pgSink)

```

### Coding style (linting, etc) tests

Style is maintained with prettier and tslint

```
yarn lint
```

## Deployment

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
