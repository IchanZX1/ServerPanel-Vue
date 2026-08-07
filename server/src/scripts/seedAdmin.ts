import { db } from '../config/db.js'
import { hashPassword } from '../utils/password.js'
import { env } from '../config/env.js'
import { v4 as uuid } from 'uuid'
import { logger } from '../utils/logger.js'
import type { RowDataPacket } from 'mysql2'

export async function seedAdminIfEmpty(): Promise<void> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM admin_users',
  )
  const count = (rows[0] as { count: number }).count
  if (count > 0) return

  const hash = await hashPassword(env.ADMIN_PASSWORD)
  await db.execute(
    `INSERT INTO admin_users (id, email, password_hash, name)
     VALUES (?, ?, ?, 'Administrator')`,
    [uuid(), env.ADMIN_EMAIL, hash],
  )
  logger.info(`[seedAdmin] Admin default dibuat: ${env.ADMIN_EMAIL}`)
  logger.warn('[seedAdmin] Ubah password admin setelah login pertama kali!')
}
