import { safeRedisGet, safeRedisSet } from '../config/redis.js'
import { decodeTokenExp } from './token.js'

const BLACKLIST_PREFIX = 'bl:'

export async function blacklistToken(token: string): Promise<void> {
  const exp = decodeTokenExp(token)
  if (!exp) return
  const ttlSeconds = exp - Math.floor(Date.now() / 1000)
  if (ttlSeconds <= 0) return
  await safeRedisSet(`${BLACKLIST_PREFIX}${token}`, '1', ttlSeconds)
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const result = await safeRedisGet(`${BLACKLIST_PREFIX}${token}`)
  return result !== null
}
