import cron from 'node-cron'
import { db } from '../config/db.js'
import { logger } from '../utils/logger.js'
import { deletePterodactylServer } from '../modules/pterodactyl/pterodactyl.service.js'
import { sendMail, mailServerTerminated } from '../utils/mailer.js'
import type { RowDataPacket } from 'mysql2'

async function runAutoDelete(): Promise<void> {
  const [servers] = await db.execute<RowDataPacket[]>(
    `SELECT s.id, s.pterodactyl_server_id, s.name, s.suspended_at,
            u.email, u.name as user_name
     FROM servers s
     JOIN users u ON u.id = s.user_id
     WHERE s.status = 'suspended'
       AND s.suspended_at IS NOT NULL
       AND s.suspended_at < DATE_SUB(NOW(), INTERVAL 15 DAY)
       AND s.deleted_at IS NULL
     LIMIT 50`,
  )

  if (!servers.length) return

  for (const server of servers as Array<{
    id: string; pterodactyl_server_id: number | null; name: string
    suspended_at: string; email: string; user_name: string
  }>) {
    try {
      // Hard delete di Pterodactyl (404 = tidak ada, lanjut saja)
      if (server.pterodactyl_server_id) {
        await deletePterodactylServer(server.pterodactyl_server_id)
      }

      const now = new Date()

      // Soft delete di MySQL — data tetap ada untuk audit invoice
      await db.execute(
        `UPDATE servers SET status = 'terminated', deleted_at = ?, updated_at = NOW()
         WHERE id = ?`,
        [now, server.id],
      )

      // Cancel pending renewals
      await db.execute(
        `UPDATE server_renewal_requests SET status = 'cancelled'
         WHERE server_id = ? AND status = 'pending'`,
        [server.id],
      )

      // Cancel pending plan changes
      await db.execute(
        `UPDATE server_plan_change_requests SET status = 'cancelled'
         WHERE server_id = ? AND status IN ('pending','scheduled')`,
        [server.id],
      )

      // Kirim email notifikasi (fire-and-forget)
      sendMail({
        to: server.email,
        subject: `Server ${server.name} telah dihapus — grace period habis`,
        html: mailServerTerminated(
          server.user_name,
          server.name,
          now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        ),
      })

      logger.info(`[autoDelete] server ${server.id} terminated after grace period`)
    } catch (err) {
      logger.error({ err, serverId: server.id }, '[autoDelete] failed to terminate server')
    }
  }
}

export function startAutoDeleteJob(): void {
  cron.schedule('* * * * *', async () => {
    await runAutoDelete()
  }, { timezone: 'Asia/Jakarta' })
  logger.info('[autoDelete] job started — grace period 15 days (Asia/Jakarta)')
}
