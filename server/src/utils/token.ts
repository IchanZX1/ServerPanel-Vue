import jwt from 'jsonwebtoken'
import { loadJwtKeys } from '../config/env.js'
import { env } from '../config/env.js'
import type { UserPayload } from '../types/express.js'

let _privateKey: string
let _publicKey: string

function getKeys() {
  if (!_privateKey || !_publicKey) {
    const keys = loadJwtKeys()
    _privateKey = keys.privateKey
    _publicKey = keys.publicKey
  }
  return { privateKey: _privateKey, publicKey: _publicKey }
}

export function signAccessToken(payload: Omit<UserPayload, 'iat' | 'exp'>): string {
  const { privateKey } = getKeys()
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  })
}

export function signRefreshToken(payload: Omit<UserPayload, 'iat' | 'exp'>): string {
  const { privateKey } = getKeys()
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    const { publicKey } = getKeys()
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as UserPayload
  } catch {
    return null
  }
}

export function decodeTokenExp(token: string): number | null {
  const decoded = jwt.decode(token) as { exp?: number } | null
  return decoded?.exp ?? null
}
