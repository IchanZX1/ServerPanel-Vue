import { db } from '../../config/db.js'
import { logger } from '../../utils/logger.js'
import type { RowDataPacket } from 'mysql2'

/**
 * Digunakan saat admin konfirmasi invoice secara manual
 * tanpa ada payment record di tabel payments
 */
export async function processAfterPaymentAdmin(invoiceId: string): Promise<void> {
  // Cek renewal request
  const [renewalRows] = await db.execute<RowDataPacket[]>(
    `SELECT srr.*, s.status as server_status, s.pterodactyl_server_id
     FROM server_renewal_requests srr
     JOIN servers s ON s.id = srr.server_id
     WHERE srr.invoice_id = ? AND srr.status = 'pending' LIMIT 1`,
    [invoiceId],
  )

  if (renewalRows[0]) {
    const renewal = renewalRows[0] as {
      id: string; server_id: string; new_active_until: string
      server_status: string; pterodactyl_server_id: number | null
    }

    await db.execute(
      `UPDATE server_renewal_requests SET status = 'applied', applied_at = NOW() WHERE id = ?`,
      [renewal.id],
    )
    await db.execute(
      `UPDATE servers SET active_until = ?, updated_at = NOW() WHERE id = ?`,
      [new Date(renewal.new_active_until), renewal.server_id],
    )

    if (renewal.server_status === 'suspended' && renewal.pterodactyl_server_id) {
      try {
        const { unsuspendPterodactylServer } = await import('../pterodactyl/pterodactyl.service.js')
        await unsuspendPterodactylServer(renewal.pterodactyl_server_id)
        await db.execute(
          `UPDATE servers SET status = 'active', suspended_at = NULL,
           suspend_reason = NULL, updated_at = NOW() WHERE id = ?`,
          [renewal.server_id],
        )
        logger.info(`[admin] server ${renewal.server_id} unsuspended after manual invoice confirm`)
      } catch (err) {
        logger.error({ err }, '[admin] unsuspend failed after manual confirm')
      }
    }
  }
}
