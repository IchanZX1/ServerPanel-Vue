import cron from 'node-cron'
import { db } from '../config/db.js'
import { logger } from '../utils/logger.js'
import { suspendPterodactylServer } from '../modules/pterodactyl/pterodactyl.service.js'
import { sendMail, mailServerSuspended } from '../utils/mailer.js'
import type { RowDataPacket } from 'mysql2'

async function runAutoSuspend(): Promise<void> {
  const [servers] = await db.execute<RowDataPacket[]>(
    `SELECT s.id, s.pterodactyl_server_id, s.user_id, s.name, s.active_until,
            u.email, u.name as user_name
     FROM servers s
     JOIN users u ON u.id = s.user_id
     WHERE s.status = 'active'
       AND s.active_until < NOW()
       AND s.deleted_at IS NULL
     LIMIT 50`,
  )

  if (!servers.length) return

  for (const server of servers as Array<{
    id: string; pterodactyl_server_id: number | null; user_id: string
    name: string; active_until: string; email: string; user_name: string
  }>) {
    try {
      // Suspend di Pterodactyl
      if (server.pterodactyl_server_id) {
        await suspendPterodactylServer(server.pterodactyl_server_id)
      }

      // Update DB — set suspended_at WAJIB untuk grace period tracking
      const now = new Date()
      await db.execute(
        `UPDATE servers SET status = 'suspended', suspended_at = ?, updated_at = NOW()
         WHERE id = ?`,
        [now, server.id],
      )

      // Hitung grace deadline (15 hari)
      const graceDeadline = new Date(now)
      graceDeadline.setDate(graceDeadline.getDate() + 15)
      const graceDeadlineStr = graceDeadline.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })

      // Kirim email notifikasi (fire-and-forget)
      sendMail({
        to: server.email,
        subject: `Server ${server.name} telah disuspend — masa aktif habis`,
        html: mailServerSuspended(
          server.user_name,
          server.name,
          new Date(server.active_until).toLocaleDateString('id-ID'),
          graceDeadlineStr,
          'http://localhost:5173/dashboard',
        ),
      })

      logger.info(
        `[autoSuspend] server ${server.id} suspended, grace until ${graceDeadlineStr}`,
      )
    } catch (err) {
      logger.error({ err, serverId: server.id }, '[autoSuspend] failed to suspend server')
      // Skip server ini, coba lagi di run berikutnya
    }
  }
}

export function startAutoSuspendJob(): void {
  cron.schedule('* * * * *', async () => {
    await runAutoSuspend()
  }, { timezone: 'Asia/Jakarta' })
  logger.info('[autoSuspend] job started — runs every minute (Asia/Jakarta)')
}
