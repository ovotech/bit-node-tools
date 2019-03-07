# Kafka Avro CLI

A CLI for inspecting the [confluent schema-registry](https://docs.confluent.io/current/schema-registry/docs/index.html), produce and consume avro kafka events.

![packages/kafka-avro-cli/README.md](../../assets/kac.gif)

## Usage

You can install it locally for your project

```bash
yarn add @ovotech/kafka-avro-cli

yarn kac --help
```

Or globally:

```bash
yarn global add @ovotech/kafka-avro-cli

kac --help
```

```
kac <command>

Commands:
  kac schema [subject]      Serach for a given topic
  kac topic [name]          Serach for a given topic
  kac create-topic <topic>  Create kafka topic
  kac produce [file]        Produce events in kafka topic from a file
  kac consume <topic>       Consume events from kafka topic. Display them in the
                            console or save them to a file

Options:
  --version     Show version number                                    [boolean]
  --config, -c  Path to the configuration file      [default: "kac.config.json"]
  --help        Show help                                              [boolean]

copyright OVO Energy 2018
```

## Commands

### Command configuration

This cli tool communicates with schema registry and kafka which require credentials and addresses. In order to configure them you need to create a `kac.config.json` file or to provide the path for it wit the `--config` option.

The file should look like this:

```json
{
  "kafkaClient": {
    "kafkaHost": "kafka.example.com:13581",
    "sslOptions": {
      "ca": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
      "key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
      "cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
    }
  },
  "schemaRegistry": "https://example-user:example-password@registry.example.com:13584"
}
```

- `kafkaClient` - options are passed directly to the [KafkaClient from node-kafka](https://github.com/SOHU-Co/kafka-node#kafkaclient).
- `schemaRegistry` - url to the schema registry, with credentials information.

```bash
kac --config my/config.json ...
```

### schema command

```bash
kac.ts schema [subject]

Used to search for, filter and get details of a particular schema in the schema
registry. [subject] is a partial name of a subject. If no subject if provided,
all subjects are returned.

Options:
  --version         Show version number                                [boolean]
  --config, -c      Path to the configuration file  [default: "kac.config.json"]
  --help            Show help                                          [boolean]
  --output-dir, -o  Save the results into a folder. One file per version
```

If more than one subject is found, it will result in a list of partial matches.

```
$ kac schema migration
Searching for "migration" in localhost:8081
Found 4 matching "migration"
----------------------------------------
migration-scheduled-value
migration-completed-2-value
migration-completed-value
```

If only one is matched, it will display the full schemas of all the versions for this subject

```
$ kac schema migration-scheduled-value
Searching for "migration-scheduled-value" in localhost:8081
Subject migration-scheduled-value found [ 1 ] versions
Version: 1 ----------------------------------------
{ type: 'record',
  name: 'TestSchema1',
  fields: [ { name: 'accountId', type: 'string' } ] }
```

### topic command

```
kac topic [name]

Used to search for, filter and get details of a particular topic in the kafka
server. [name] is a partial name of a topic. If no name if provided, all topics
are returned.

Options:
  --version     Show version number                                    [boolean]
  --config, -c  Path to the configuration file      [default: "kac.config.json"]
  --help        Show help
```

If more than one topic is found, it will result in a list of partial matches.

```
$ kac topic migration
Searching for "migration" in localhost:29092
Found 3 matching "migration"
----------------------------------------
migration-scheduled
migration-completed-2
migration-completed
```

If only one is matched, it will display the full metadata of the partitions on that topic

```
$ kac topic migration-completed-2
Searching for "migration-completed-2" in localhost:29092
Metadata for migration-completed-2
----------------------------------------
{ '0':
   { topic: 'migration-completed-2',
     partition: 0,
     leader: 1001,
     replicas: [ 1001 ],
     isr: [ 1001 ] },
  '1':
   { topic: 'migration-completed-2',
     partition: 1,
     leader: 1001,
     replicas: [ 1001 ],
     isr: [ 1001 ] } }
```

# create-topic command

```
kac create-topic <topic>

Creates a topic in the kafka server with configurable partitions count and
replication factor.

Options:
  --version             Show version number                            [boolean]
  --config, -c          Path to the configuration file
                                                    [default: "kac.config.json"]
  --help                Show help                                      [boolean]
  --partitions          Number of partitions for topic     [number] [default: 1]
  --replication-factor                                     [number] [default: 1]
```

For example:

```
$ kac create-topic test-topic --partitions 2
Topic created test-topic partitions 2 replication factor 1
```

# produce command

```
kac produce [file]

Produce events in kafka topic from a file

Options:
  --version     Show version number                                    [boolean]
  --config, -c  Path to the configuration file      [default: "kac.config.json"]
  --help        Show help                                              [boolean]
```

The file needed to produce the topics should look something like this:

```json
{
  "0": {
    "topic": "migration-completed-2",
    "schema": {
      "type": "record",
      "name": "TestSchema1",
      "fields": [{ "name": "accountId", "type": "string" }]
    },
    "partition": 0,
    "key": "some key",
    "messages": [{ "accountId": "67096" }, { "accountId": "57096" }]
  },
  "1": {
    "topic": "migration-scheduled",
    "schema": {
      "type": "record",
      "name": "TestSchema1",
      "fields": [{ "name": "customerId", "type": "string" }]
    },
    "partition": 1,
    "key": "some other key",
    "messages": [{ "customerId": "12321" }, { "customerId": "32131" }]
  }
}
```

This should allow you to produce events in different partitions.

### consume command

```
kac consume <topic>

Consume events from kafka topic. Display them in the console or save them to a
file

Options:
  --version          Show version number                               [boolean]
  --config, -c       Path to the configuration file [default: "kac.config.json"]
  --help             Show help                                         [boolean]
  --group            Consumer Group Id         [default: a prefixed random name]
  --tail             Keep listening after all messages consumed
                                                      [boolean] [default: false]
  --output-file, -o  Save the results into a file, that can later be used to
                     produce those events
```

To display the contents of a topic simply write the full topic name.

The consumer group will terminate once all the messages have been consumed, but you can keep listening with the `--tail` option.

```
$ kac consume migration-completed-2
Consume messages in migration-completed-2
----------------------------------------
Offset 0/1 partition 0 key null
BalanceMigrationCompletedEvent {
  accountId: '6666666' }
----------------------------------------
Offset 1/1 partition 0 key null
BalanceMigrationCompletedEvent {
  accountId: '5555555' }
----------------------------------------
Offset 0/1 partition 1 key null
BalanceMigrationCompletedEvent {
  accountId: '4444444' }
----------------------------------------
Offset 1/1 partition 1 key null
BalanceMigrationCompletedEvent {
  accountId: '3333333' }
----------------------------------------
[============================================================] 100% Elapsed: 0.0s
Consumed 4 messages
 - Partition 0 : 2 messages.
 - Partition 1 : 2 messages.
```

You can also write the output to a file with the `--output-file` option. The contents of that file would be in the same format, as the one used to produce the events with the `produce` command.

```
$ kac consume migration-completed-2 --output-file test2.json
Writing to file test2.json from topic migration-completed-2
----------------------------------------
[============================================================] 100% Elapsed: 0.0s

Consumed 8 messages
 - Partition 0 : 4 messages.
 - Partition 1 : 4 messages.
```

## Gotchas

Due to some setTimeout calls in the underlying kafka-node library, the consume command will almost always take at least 30 seconds. After the final message has been printed you can simply terminate the process (cntr+C) without waiting for the full timeout.

## Running the tests

The tests require a running kafka server and schema-registry service. This is setup easily with a docker-compose from root project folder:

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

To deploy a new version, push to master and then create a new release. CircleCI will automatically build and deploy a the version to the npm registry.
All package versions are synchronized, but it will only publish the versions of the packages that have changed.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test/integration.spec.ts](test/integration.spec.ts)).

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
