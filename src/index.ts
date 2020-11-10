import redis from 'async-redis'
import { BaseConnector, Reshuffle } from 'reshuffle-base-connector'

type Options = Record<string, any>

export type Sequence = (client: any) => any

export class RedisConnector extends BaseConnector {
  private client?

  constructor(app: Reshuffle, options: Options = {}, id?: string) {
    super(app, options, id)
    if (typeof options.endpoint !== 'string') {
      throw new Error(`Invalid endpoint: ${options.endpoint}`)
    }

    console.log('Connecting to Redis:', options.endpoint)
    const [host, port] = options.endpoint.split(':')
    this.client = redis.createClient({
      host: validateHost(host),
      port: validatePort(port),
      password: options.password,
    })

    this.client.on('error', (error: any) => {
      throw new Error(`Redis error: ${error.message}`)
    })
  }

  // Actions ////////////////////////////////////////////////////////

  public async append(key: string, value: any) {
    return this.sdk().append(key, value)
  }

  public async close() {
    await this.sdk().quit()
    this.client = undefined
  }

  public async decr(key: string) {
    return this.sdk().decr(key)
  }

  public async decrby(key: string, decrement: number) {
    return this.sdk().decrby(key, decrement)
  }

  public async del(key: string) {
    return this.sdk().del(key)
  }

  public async exists(key: string) {
    return this.sdk().exists(key)
  }

  public async get(key: string) {
    return this.sdk().get(key)
  }

  public async getset(key: string, value: string) {
    return this.sdk().getset(key, value)
  }

  public async hdel(key: string, field: string) {
    return this.sdk().hdel(key, field)
  }

  public async hexists(key: string, field: string) {
    return this.sdk().hexists(key, field)
  }

  public async hget(key: string, field: string) {
    return this.sdk().hget(key, field)
  }

  public async hgetall(key: string) {
    return this.sdk().hgetall(key)
  }

  public async hincrby(key: string, field: string, increment: number) {
    return this.sdk().hincrby(key, field, Math.round(increment))
  }

  public async hincrbyfloat(key: string, field: string, increment: number) {
    return this.sdk().hincrbyfloat(key, field, increment)
  }

  public async hkeys(key: string) {
    return this.sdk().hkeys(key)
  }

  public async hlen(key: string) {
    return this.sdk().hlen(key)
  }

  public async hmget(key: string, fields: string[]) {
    return this.sdk().hmget(key, ...fields)
  }

  public async hmset(key: string, dict: Record<string, any>) {
    const pairs = Object.entries(dict)
      .map(([field, value]) => ([field, value]))
      .flat()
    return this.sdk().hmset(key, ...pairs)
  }

  public async hset(key: string, field: string, value: any) {
    return this.sdk().hset(key, field, value)
  }

  public async hsetnx(key: string, field: string, value: any) {
    return this.sdk().hsetnx(key, field, value)
  }

  public async hstrlen(key: string, field: string) {
    return this.sdk().hstrlen(key, field)
  }

  public async hvals(key: string) {
    return this.sdk().hvals(key)
  }

  public async incr(key: string) {
    return this.sdk().incr(key)
  }

  public async incrby(key: string, increment: number) {
    return this.sdk().incrby(key, Math.round(increment))
  }

  public async incrbyfloat(key: string, increment: number) {
    return this.sdk().incrbyfloat(key, increment)
  }

  public async mget(keys: string[]) {
    return this.sdk().mget(...keys)
  }

  public async mset(dict: Record<string, any>) {
    const pairs = Object.entries(dict)
      .map(([field, value]) => ([field, value]))
      .flat()
    return this.sdk().mset(...pairs)
  }

  public async set(key: string, value: any) {
    return this.sdk().set(key, value)
  }

  public async setnx(key: string, value: any) {
    return this.sdk().setnx(key, value)
  }

  public async keys(pattern: string): Promise<string[]> {
    const ks: string[] = await this.sdk().keys(pattern)
    return ks
  }

  public async sequence(seq: Sequence) {
    return seq(this.sdk())
  }

  public async transaction(seq: Sequence) {
    const multi = this.sdk().multi()
    try {
      const returnCode = await seq(multi)
      await multi.exec()
      return returnCode
    } catch (error) {
      await multi.discard()
      throw error
    }
  }

  public sdk(): any {
    if (!this.client) {
      throw new Error('Not connected to Redis')
    }
    return this.client
  }
}

function validateHost(host: string) {
  if (!/^[a-z0-9-]+(\.[a-z0-9\\-]+)*$/.test(host)) {
    throw new Error(`Invalid host: ${host}`)
  }
  return host
}

const PORT = new RegExp(
  '^(\\d{2,4}|[12345]\\d{4}|6[01234]\\d{3}|' +
  '65[01234]\\d{2}|655[012]\\d|6553[012345])$'
)

function validatePort(port: string | number | undefined) {
  if (port === undefined) {
    return 6379
  }
  if (
    typeof port === 'number' &&
    0 < port && port < 65536 &&
    Math.floor(port) === port
  ) {
    return port
  }
  if (typeof port === 'string' && PORT.test(port)) {
    return parseInt(port, 10)
  }
  throw new Error(`Invalid port: ${port}`)
}
