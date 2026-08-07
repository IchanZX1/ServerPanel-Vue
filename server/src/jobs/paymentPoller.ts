import cron from 'node-cron'
import { db } from '../config/db.js'
import { logger } from '../utils/logger.js'
import { pollPaymentStatus } from '../modules/payment/payment.service.js'
import type { RowDataPacket } from 'mysql2'

async function runPaymentPoller(): Promise<void> {
  const [payments] = await db.execute<RowDataPacket[]>(
    `SELECT p.id, p.invoice_id, p.redirect_url, p.poll_count
     FROM payments p
     WHERE p.status = 'pending'
       AND p.poll_count < 36
       AND p.created_at > DATE_SUB(NOW(), INTERVAL 6 HOUR)
     LIMIT 20`,
  )

  for (const payment of payments as Array<{
    id: string; invoice_id: string; redirect_url: string; poll_count: number
  }>) {
    await pollPaymentStatus(payment.id, payment.invoice_id, payment.redirect_url, payment.poll_count)
  }
}

export function startPaymentPoller(): void {
  // Interval 10 detik sebagai safety net
  cron.schedule('*/10 * * * * *', async () => {
    await runPaymentPoller()
  })
  logger.info('[paymentPoller] started — polling every 10 seconds')
}
