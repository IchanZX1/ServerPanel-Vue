import 'dotenv/config'
import { env } from './config/env.js'
import { testDbConnection } from './config/db.js'
import { testRedisConnection } from './config/redis.js'
import { startAutoSuspendJob } from './jobs/autoSuspend.js'
import { startAutoDeleteJob } from './jobs/autoDelete.js'
import { startPaymentPoller } from './jobs/paymentPoller.js'
import { logger } from './utils/logger.js'
import app from './app.js'

async function bootstrap() {
  // Validasi koneksi DB
  await testDbConnection()

  // Redis — opsional, server tetap jalan meski Redis tidak tersedia
  try {
    await testRedisConnection()
  } catch (err) {
    console.warn('[redis] Redis tidak tersedia, beberapa fitur (session, blacklist token) akan dinonaktifkan:', (err as Error).message)
  }

  // Seed admin default jika belum ada
  const { seedAdminIfEmpty } = await import('./scripts/seedAdmin.js')
  await seedAdminIfEmpty()

  // Start background jobs
  startAutoSuspendJob()
  startAutoDeleteJob()
  startPaymentPoller()

  // Start HTTP server
  const port = parseInt(env.PORT, 10)
  app.listen(port, () => {
    logger.info(`[server] Panel Server V2 Backend running on port ${port} (${env.NODE_ENV})`)
  })
}

bootstrap().catch((err: Error) => {
  logger.error({ err }, '[server] Failed to start')
  process.exit(1)
})
