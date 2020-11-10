# reshuffle-redis-connector

[Code](https://github.com/reshufflehq/reshuffle-redis-connector) |
[npm](https://www.npmjs.com/package/reshuffle-redis-connector) |
[Code sample](https://github.com/reshufflehq/reshuffle-redis-connector/examples)

`npm install reshuffle-redis-connector`

### Reshuffle Redis Connector

This package contains a [Resshufle](https://github.com/reshufflehq/reshuffle)
connector to Redis databases.

The following example sets and gets a value from Redis:

```js
const { Reshuffle } = require('reshuffle')
const { RedisConnector } = require('reshuffle-redis-connector')

;(async () => {
  const app = new Reshuffle()

  const redis = new RedisConnector(app, {
    endpoint: process.env.REDIS_ENDPOINT,
    password: process.env.REDIS_PASSWORD,
  })

  await redis.set('key', 'value')
  console.log(await redis.get('key')) // 'value'

  await redis.close()

})().catch(console.error)
```

##### <a name="configuration"></a>Configuration options

```js
const app = new Reshuffle()
const redis = new RedisConnector(app, {
  endpoint: process.env.REDIS_ENDPOINT, // <hostname>:<port>
  password: process.env.REDIS_PASSWORD,
})
```

#### Connector actions

##### <a name="close"></a>Close action

_Definition:_

```ts
() => void
```

_Usage:_

```js
await redis.close()
```

Close all connections to the database. If an application terminates without
calling close, it might hang for a few seconds until active connections
time out.

##### <a name="sequence"></a>Sequence action

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

##### <a name="transaction"></a>Transaction action

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

Use `transaction` to run multiple queries as an atomic sequence using
[Redis transaction](https://redis.io/topics/transactions) and the MULTI
command. All operations either succed or fail together.

#### SDK actions

The `sdk()` action provides raw access to the async version of [npm redis](https://www.npmjs.com/package/redis). The following actions are provided
as covenience wrappers for it's corresponding async methods. For instance,
calling `redis.sdk().append()` is equivalent to `redis.append()`. You can
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

##### <a name="close"></a>Close action

_Definition:_

```ts
() => void
```

_Usage:_

```js
await pg.close()
```

Close all connections to the database. If an application terminates without
calling close, it might hang for a few seconds until active connections
time out.

##### <a name="query"></a>Query action

_Definition:_

```ts
(
  sql: string,
  params?: any[],
) => {
  fields: { name: string }[],
  rows: any[],
  rowCount: number,
}
```

_Usage:_

```js
await pg.query("INSERT INTO users VALUES ('John', 'Coltrane', 42)")

const family = await pg.query(
  "SELECT firstName, lastName, age FROM users WHERE lastName='Coltrane'"
)
// {
//   rowCount: 2,
//   fields: [{ name: 'firstName' }, { name: 'lastName' }, { name: 'age' }],
//   rows: [
//     { firstName: 'Alice', lastName: 'Coltrane', age: 31 },
//     { firstName: 'John', lastName: 'Coltrane', age: 42 },
//   ],
// }

const avgResponse = await pg.query(
  "SELECT average(age) AS avg FROM users WHERE lastName='Coltrane'"
)
const averageAge = avgResponse.rows[0].avg
// 36.5
```

The `query` action can be used to run _any_ SQL command on the connected
database (not just `SELECT`). The query is defined in the `sql` string. The
optional `params` can be used to generate parameterized queries, as shown in
the following example:

```js
const age = await pg.query(
  "SELECT age FROM users WHERE firstName=$1 and lastName=$2",
  ['John', 'Smith']
)
```

This action returns an object with the results of the query, where
`fields` is an array of all field names, as returned by the query.
Field names in a `SELECT` query are column names, or are specified
with an `AS` clause.  Every element of `rows` is uses the names in
`fields` as its object keys.

Note that every call to `query` may use a different database connection.
You can use the [sequence](#sequence) or [transaction](#transaction) actions
if such a guarantee is required.

##### <a name="sequence"></a>Sequence action

_Definition:_
```js
(
  seq: (query) => any,
) => any
```

_Usage:_

```js
const res = await pg.sequence(async (query) => {
  await query("INSERT INTO users VALUES ('Miles', 'Davis', 43)")
  return query("SELECT COUNT(*) FROM users")
})
const userCount = res.rows[0].count
// 3
```

Use `sequence` to perform multiple queries on the same database connection.
This action receives a `seq` function that may issue queries to the database,
all of which are guaranteed to run through the same connection. `seq` gets
one argument, which is a `query` function that can be used the same way as
the [query](#query) action. `seq` may, of course, use any JavaScript code to
implement its logic, log to the console etc.

Note that while `sequence` uses the same connection to run all queries, it
does not offer the transactional guarantees offered by
[transaction](#transaction). You can use it for weak isolation models, or
construct transactions directly without using `transaction`.

##### <a name="transaction"></a>Transaction action

_Definition:_
```js
(
  seq: (query) => any,
) => any
```

_Usage:_

```js
await pg.transaction(async (query) => {
  const res = await query("SELECT COUNT(*) FROM users")
  const userCount = res.rows[0].count
  if (100 <= userCount) {
    throw new Error('Too many users:', userCount)
  }
  return query("INSERT INTO users VALUES ('Charlie', 'Parker', 49)")
})
```

Use `transaction` to run multiple queries as an atomic SQL transaction.
The interface is identical to the [sequence action](#sequence), but all
the queries issued `seq` either success or fail together. If any of the
queries fail, all queries are rolled back and an error is thrown.

Consider, for example, the following code for updating a bank account
balance:

```js
const accountId = 289
const change = +1000
pg.transaction(async (query) => {
  await query(`
    UPDATE accounts
      SET balance = balance + $1
      WHERE account_id = $2
    `,
    [change, accountId],
  )
  await query(`
    INSERT INTO accounts_log(account_id, change, time)
      VALUES ($1, $2, current_timestamp)
    `,
    [change, accountId],
  )
})
```

In the example above, `accounts` holds current balances of accounts,
while `accounts_log` holds a history of all changes made. Using `transaction`
ensures that both tables are always updated together.
