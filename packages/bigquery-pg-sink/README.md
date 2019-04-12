# BigQuery PG Sink

Stream the results of query made by [nodejs-bigquery](https://github.com/googleapis/nodejs-bigquery) into a [postgres database](https://www.postgresql.org/).

### Using

```bash
yarn add @ovotech/bigquery-pg-sink
```

```typescript
import { BigQueryPGSinkStream } from '@ovotech/bigquery-pg-sink';
import { Client } from 'pg';

export const insertQuery = (table: string, rows: any[]): [string, any[]] => {
  // transform each result into a flat array of values
  // i.e. [1, 200, 2, 300]
  const flatRows = rows.map(bigQueryResult => {
    return [
      bigQueryResult.id,
      bigQueryResult.balance,
    ]
  }).flat();

  // generate the values insert string
  // i.e. ($1,$2,$3,.....)
  const columns = [...Array(11)];
  const insertValuesString = rows
    .map(
      (_, rowIndex) =>
        `(${columns
          .map((row: any, index) => '$' + {index + 1 + rowIndex * columns.length})
          .join(',')})`,
    )
    .join(',');
  return [
    `INSERT INTO ${table}
      (
        id,
        balance
      ) VALUES ${insertValuesString}
    `,
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
