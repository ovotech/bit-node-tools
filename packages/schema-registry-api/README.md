# Schema Registry API

A simple typescript [node-fetch](https://github.com/bitinn/node-fetch) wrapper on the [confluent schema-registry](https://docs.confluent.io/current/schema-registry/docs/index.html) api.

This allows calling the api in a promise-based type-safe manner.

### Using

```bash
yarn add @ovotech/schema-registry-api
```

```typescript
import { Schema } from 'avsc';
const schema: Schema = {
  type: 'record',
  name: 'TestSchema',
  fields: [{ name: 'accountId', type: 'string' }],
};

const subjects = await getSubjects(schemaRegistryUrl);
const newVersion = await addSubjectVersion(schemaRegistryUrl, 'clients', schema);
const foundSchema = await getSchema(schemaRegistryUrl, newVersion.id);
```

The api rest endpoint are directly translated into functions calling node-fetch:

| Function                                                                                            | Rest Docs                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getSchema(baseUrl: string, id: number)`                                                            | [`GET /schemas/ids/:id`](https://docs.confluent.io/current/schema-registry/docs/api.html#get--schemas-ids-int-%20id)                                                                                            |
| `getSubjects(baseUrl: string)`                                                                      | [`GET /subjects`](https://docs.confluent.io/current/schema-registry/docs/api.html#get--subjects)                                                                                                                |
| `getSubjectVersions(baseUrl: string, subject: string)`                                              | [`GET /subjects/:subject/versions`](<https://docs.confluent.io/current/schema-registry/docs/api.html#get--subjects-(string-%20subject)-versions>)                                                               |
| `deleteSubject(baseUrl: string, subject: string)`                                                   | [`DELETE /subjects/:subject`](<https://docs.confluent.io/current/schema-registry/docs/api.html#delete--subjects-(string-%20subject)>)                                                                           |
| `getSubjectVersionSchema(baseUrl: string, subject: string, version: number)`                        | [`GET /subjects/:subject/versions/:version/schema`](<https://docs.confluent.io/current/schema-registry/docs/api.html#get--subjects-(string-%20subject)-versions-(versionId-%20version)-schema>)                 |
| `addSubjectVersion(baseUrl: string, subject: string, schema: Schema)`                               | [`POST /subjects/:subject/versions`](<https://docs.confluent.io/current/schema-registry/docs/api.html#post--subjects-(string-%20subject)-versions>)                                                             |
| `checkSubjectRegistered(baseUrl: string, subject: string, schema: Schema)`                          | [`POST /subjects/:subject`](<https://docs.confluent.io/current/schema-registry/docs/api.html#post--subjects-(string-%20subject)>)                                                                               |
| `deleteSubjectVersion(baseUrl: string, subject: string, version: number)`                           | [`DELETE /subjects/:subject/versions/:version`](<https://docs.confluent.io/current/schema-registry/docs/api.html#delete--subjects-(string-%20subject)-versions-(versionId-%20version)>)                         |
| `checkCompatibility( baseUrl: string, subject: string, version: number | 'latest', schema: Schema)` | [`POST /compatibility/subjects/:subject/versions/:version`](<https://docs.confluent.io/current/schema-registry/docs/api.html#post--compatibility-subjects-(string-%20subject)-versions-(versionId-%20version)>) |

But there are also to slightly higher level functions:

`idToSchema(baseUrl: string, id: number)` - return a schema as a parsed `Schema` object from a schema id.
`schemaToId(baseUrl: string, subject: string, schema: Schema)` - return the id of a schema object. This will check for an existence of a schema within the given subject, and create a schema version if one was not found.

## Running the tests

The tests require a running schema registry service, and we're using docker compose to start it, alongside kafka and zookeeper, required by the service.

So in the project's parent directory run:

```bash
docker-compose up
```

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

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
