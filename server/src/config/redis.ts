import { Redis } from 'ioredis'
import { env } from './env.js'

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT, 10),
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null, // jangan retry — fail cepat
})

let redisAvailable = false

redis.on('ready', () => { redisAvailable = true })
redis.on('error', () => { redisAvailable = false })
redis.on('close', () => { redisAvailable = false })

export function isRedisAvailable(): boolean {
  return redisAvailable
}

export async function testRedisConnection(): Promise<void> {
  await redis.connect()
  redisAvailable = true
  console.info('[redis] Redis connection ready')
}

// Safe wrappers — tidak throw jika Redis tidak tersedia
export async function safeRedisGet(key: string): Promise<string | null> {
  if (!redisAvailable) return null
  try { return await redis.get(key) } catch { return null }
}

export async function safeRedisSet(key: string, value: string, ex?: number): Promise<void> {
  if (!redisAvailable) return
  try {
    if (ex) await redis.set(key, value, 'EX', ex)
    else await redis.set(key, value)
  } catch { /* silent */ }
}

export async function safeRedisDel(key: string): Promise<void> {
  if (!redisAvailable) return
  try { await redis.del(key) } catch { /* silent */ }
}
