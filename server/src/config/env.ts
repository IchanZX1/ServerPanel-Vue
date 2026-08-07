import { z } from 'zod'
import fs from 'fs'

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // JWT
  JWT_PRIVATE_KEY_PATH: z.string(),
  JWT_PUBLIC_KEY_PATH: z.string(),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // Database
  DB_HOST: z.string(),
  DB_PORT: z.string().default('3306'),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_CONNECTION_LIMIT: z.string().default('10'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().default(''),

  // SMTP
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string(),

  // Pterodactyl
  PTERO_BASE_URL: z.string().url(),
  PTERO_API_KEY: z.string(),
  PTERO_NODE_ID: z.string(),
  PTERO_EGG_ID: z.string(),
  PTERO_NEST_ID: z.string(),
  PTERO_LOCATION_ID: z.string(),
  PTERO_DOCKER_IMAGE: z.string(),

  // Sociabuzz / Maelyn
  MAELYN_API_KEY: z.string(),
  MAELYN_BASE_URL: z.string().url(),
  // Username Sociabuzz merchant (akun pemilik API key Maelyn) — sesuai panduan
  // docs/mission/architecture-system-sociabuzz.md (createPaymentSociabuzz("ichanzx", ...))
  MAELYN_SOCIABUZZ_USERNAME: z.string().default('ichanzx'),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64),

  // Cloudflare Turnstile
  TURNSTILE_SECRET_KEY: z.string().default(''),

  // Admin seed
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),

  // Session
  SESSION_SECRET: z.string().min(32),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('[env] Environment variable validation failed:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data

// Load JWT keys (validated at startup)
export function loadJwtKeys() {
  const privateKey = fs.readFileSync(env.JWT_PRIVATE_KEY_PATH, 'utf8')
  const publicKey = fs.readFileSync(env.JWT_PUBLIC_KEY_PATH, 'utf8')
  return { privateKey, publicKey }
}
