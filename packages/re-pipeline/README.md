# Re Pipeline

A node streams pipeline implementation, that reconnects the pipes on error, once the error has been handled.

### Using

```bash
yarn add @ovotech/re-pipeline
```

Using `stream-mock` to mock out the readable and writable streams. Whenever an error is encountered by any of the streams, it would call the error handler and then reconnect the pipes again.

```typescript
import { rePipeline } from '@ovotech/re-pipeline';
import { ReadableMock, WritableMock } from 'stream-mock';
import { Transform } from 'stream';

const start = new ReadableMock(['one', 'two'], { objectMode: true });
const end = new WritableMock({ objectMode: true });
const upperCase = new Transform({
  objectMode: true,
  transform: (item, encoding, callback) => callback(undefined, String(item).toUpperCase()),
});

const errorHandler = error => console.log(error);

const pipeline = rePipeline(errorHandler, start, upperCase, end);

pipeline.on('finish', () => console.log(end.data));
```

You can use the promise version. When the stream has finished it would resolve the promise, and if any error is encountered, it would reject the promise. This would not reconnect the pipes.

```typescript
import { rePipelinePromise } from '@ovotech/re-pipeline';
import { ReadableMock, WritableMock } from 'stream-mock';
import { Transform } from 'stream';

const start = new ReadableMock(['one', 'two'], { objectMode: true });
const end = new WritableMock({ objectMode: true });
const upperCase = new Transform({
  objectMode: true,
  transform: (item, encoding, callback) => callback(undefined, String(item).toUpperCase()),
});

const main = async () => {
  await pipelinePromise(start, upperCase, end);
  console.log(end.data);
};
```

## Running the tests

Then you can run the tests with:

```bash
yarn test
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
