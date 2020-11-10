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
