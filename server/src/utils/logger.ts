import pino from 'pino'
import { env } from '../config/env.js'

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : {}),
  redact: {
    paths: [
      'password',
      'password_hash',
      'panel_password_enc',
      'newPassword',
      'confirmPassword',
      'token',
      'refreshToken',
      'accessToken',
      '*.password',
      '*.password_hash',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
})
