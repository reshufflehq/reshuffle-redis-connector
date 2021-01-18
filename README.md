# reshuffle-redis-connector

[Code](https://github.com/reshufflehq/reshuffle-redis-connector) |
[npm](https://www.npmjs.com/package/reshuffle-redis-connector) |
[Code sample](https://github.com/reshufflehq/reshuffle-redis-connector/tree/master/examples)

`npm install reshuffle-redis-connector`

### Reshuffle Redis Connector

This package contains a [Reshuffle](https://reshuffle.com)
connector to Redis databases.

The following example sets and gets a value from Redis:

```js
const { Reshuffle } = require('reshuffle')
const { RedisConnector } = require('reshuffle-redis-connector')

const app = new Reshuffle()

const redis = new RedisConnector(app, {
  endpoint: process.env.REDIS_ENDPOINT,
  password: process.env.REDIS_PASSWORD,
})

async function main() {
  try {
    await redis.set('key', 'value')
    console.log(await redis.get('key')) // 'value'
  } catch (error) {
    console.error(error)
  }   
}

app.start()
main()
```

### Table of Contents

[Configuration Options](#configuration)

#### Connector actions

[sequence](#sequence) Run a sequence of queries

[transaction](#transaction) Run a sequence of queries inside a transaction

[sdk](#sdk) Returns the Node Redis Client that allows direct calls to the underlying redis

[close](#close) Close redis connections

### <a name="configuration"></a> Configuration options

```js
const app = new Reshuffle()
const redis = new RedisConnector(app, {
  endpoint: process.env.REDIS_ENDPOINT, // <hostname>:<port>
  password: process.env.REDIS_PASSWORD,
})
```

### Connector actions

#### <a name="sequence"></a> Sequence action

_Definition:_
```js
(
  seq: (query) => any,
) => any
```

_Usage:_

```js
const res = await res.sequence(async (conn) => {
  const val = conn.get('key')
  conn.set('key', val + 1)
})
```

Use `sequence` to perform multiple queries on the same database connection.
This assures sequential access, but not atomicity in case other connections
are open to the database.

##### <a name="transaction"></a> Transaction action

_Definition:_
```js
(
  seq: (query) => any,
) => any
```

_Usage:_

```js
await redis.transaction(async (multi) => {
  const val = multi.get('key')
  multi.set('key', val + 1)
})
```

Use `transaction` to execute multiple queries as an atomic sequence using a
[Redis transaction](https://redis.io/topics/transactions) and the MULTI
command. 

All operations either succeed or fail together.

#### <a name="sdk"></a> SDK action

The `sdk()` action provides raw access to the async version of [npm redis](https://www.npmjs.com/package/redis). The following actions are provided
as convenience wrappers for its corresponding async methods. 

For instance, calling `redis.sdk().append()` is equivalent to `redis.append()`. You can
access the methods not listed below using the `redis.sdk().` notation.

```ts
async function append(key: string, value: any)
async function decr(key: string)
async function decrby(key: string, decrement: number)
async function del(key: string)
async function exists(key: string)
async function get(key: string)
async function getset(key: string, value: string)
async function hdel(key: string, field: string)
async function hexists(key: string, field: string)
async function hget(key: string, field: string)
async function hgetall(key: string)
async function hincrby(key: string, field: string, increment: number)
async function hincrbyfloat(key: string, field: string, increment: number)
async function hkeys(key: string)
async function hlen(key: string)
async function hmget(key: string, fields: string[])
async function hmset(key: string, dict: Record<string, any>)
async function hset(key: string, field: string, value: any)
async function hsetnx(key: string, field: string, value: any)
async function hstrlen(key: string, field: string)
async function hvals(key: string)
async function incr(key: string)
async function incrby(key: string, increment: number)
async function incrbyfloat(key: string, increment: number)
async function mget(keys: string[])
async function mset(dict: Record<string, any>)
async function set(key: string, value: any)
async function setnx(key: string, value: any)
async function keys(pattern: string): Promise<string[]>
```

#### <a name="close"></a> Close action

_Definition:_

```ts
() => void
```

_Usage:_

```js
await redis.close()
```

Close all connections to redis. If an application terminates without
calling close, it might hang for a few seconds until all active connections
time out.
