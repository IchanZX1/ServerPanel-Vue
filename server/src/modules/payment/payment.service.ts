import { v4 as uuid } from 'uuid'
import { env } from '../../config/env.js'
import { safeRedisGet, safeRedisSet } from '../../config/redis.js'
import { db } from '../../config/db.js'
import { logger } from '../../utils/logger.js'
import type { RowDataPacket } from 'mysql2'


// ─── Sociabuzz / Maelyn API ───────────────────────────────────────────────────

export async function createSociabuzzPayment(data: {
  invoiceId: string
  userId: string
  amount: number
  description: string
}): Promise<{
  paymentId: string
  orderId: string
  invId: string
  redirectUrl: string
  qrBase64: string | null
  expiredAt: string
}> {
  const orderId = `PSV2-${uuid().slice(0, 8).toUpperCase()}`

  const res = await fetch(`${env.MAELYN_BASE_URL}/v1/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MAELYN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_id: orderId,
      amount: data.amount,
      description: data.description,
      expired_time: 3600, // 1 jam dalam detik
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Maelyn createPayment failed: ${res.status} ${err}`)
  }

  const json = await res.json() as {
    order_id: string
    inv_id: string
    redirect_url: string
    qr_string?: string
    expired_at: string
  }

  // Simpan qr_string di Redis (bukan DB) dengan TTL sesuai expired_at
  let qrBase64: string | null = null
  if (json.qr_string) {
    const ttl = Math.floor((new Date(json.expired_at).getTime() - Date.now()) / 1000)
    await safeRedisSet(`qr:${data.invoiceId}`, json.qr_string, Math.max(ttl, 60))
    qrBase64 = `data:image/png;base64,${Buffer.from(json.qr_string).toString('base64')}`
  }

  // Simpan payment ke DB
  const paymentId = uuid()
  await db.execute(
    `INSERT INTO payments
     (id, invoice_id, user_id, order_id, inv_id, amount, redirect_url, status, poll_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
    [paymentId, data.invoiceId, data.userId, orderId, json.inv_id, data.amount, json.redirect_url],
  )

  // Update invoice.active_payment_id
  await db.execute(
    'UPDATE invoices SET active_payment_id = ?, updated_at = NOW() WHERE id = ?',
    [paymentId, data.invoiceId],
  )

  return {
    paymentId,
    orderId,
    invId: json.inv_id,
    redirectUrl: json.redirect_url,
    qrBase64,
    expiredAt: json.expired_at,
  }
}

export async function getQrString(invoiceId: string): Promise<string | null> {
  const qrString = await safeRedisGet(`qr:${invoiceId}`)
  if (!qrString) return null
  return `data:image/png;base64,${Buffer.from(qrString).toString('base64')}`
}

export async function checkPaymentStatus(paymentId: string, userId: string): Promise<{
  paymentId: string
  status: string
  amount: number
  paidAt: string | null
}> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT p.*, i.status as invoice_status
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     WHERE p.id = ? AND p.user_id = ? LIMIT 1`,
    [paymentId, userId],
  )
  const payment = rows[0] as {
    id: string; status: string; amount: number; paid_at: string | null;
    redirect_url: string; invoice_id: string; poll_count: number
  } | undefined

  if (!payment) throw new Error('Payment tidak ditemukan')

  // Jika masih pending — poll Maelyn
  if (payment.status === 'pending') {
    await pollPaymentStatus(payment.id, payment.invoice_id, payment.redirect_url, payment.poll_count)
    // Re-fetch status terbaru
    const [updatedRows] = await db.execute<RowDataPacket[]>(
      'SELECT id, status, amount, paid_at FROM payments WHERE id = ? LIMIT 1',
      [paymentId],
    )
    const updated = updatedRows[0] as { id: string; status: string; amount: number; paid_at: string | null }
    return { paymentId: updated.id, status: updated.status, amount: updated.amount, paidAt: updated.paid_at }
  }

  return { paymentId: payment.id, status: payment.status, amount: payment.amount, paidAt: payment.paid_at }
}

/**
 * Poll Maelyn redirect_url untuk cek status pembayaran.
 * Scraping title halaman — sesuai referensi architecture-system-sociabuzz.md
 */
export async function pollPaymentStatus(
  paymentId: string,
  invoiceId: string,
  redirectUrl: string,
  currentPollCount: number,
): Promise<void> {
  try {
    const res = await fetch(redirectUrl, { signal: AbortSignal.timeout(10000) })
    const html = await res.text()

    // Cek status dari konten halaman
    const paid = html.toLowerCase().includes('pembayaran berhasil') ||
                 html.toLowerCase().includes('payment success') ||
                 html.toLowerCase().includes('sudah dibayar')
    const expired = html.toLowerCase().includes('expired') ||
                    html.toLowerCase().includes('kadaluarsa')

    const newPollCount = currentPollCount + 1

    if (paid) {
      await markPaymentPaid(paymentId, invoiceId)
    } else if (expired || newPollCount >= 36) {
      await db.execute(
        `UPDATE payments SET status = 'expired', poll_count = ?, updated_at = NOW() WHERE id = ?`,
        [newPollCount, paymentId],
      )
    } else {
      await db.execute(
        'UPDATE payments SET poll_count = ?, updated_at = NOW() WHERE id = ?',
        [newPollCount, paymentId],
      )
    }
  } catch (err) {
    logger.error({ err, paymentId }, '[payment] poll failed')
  }
}

export async function markPaymentPaid(paymentId: string, invoiceId: string): Promise<void> {
  // Update payment
  await db.execute(
    `UPDATE payments SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ?`,
    [paymentId],
  )

  // Update invoice
  await db.execute(
    `UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ?`,
    [invoiceId],
  )

  // Proses setelah payment paid
  await processAfterPayment(invoiceId)
}

/**
 * Proses yang dijalankan setelah invoice paid:
 * - Apply renewal (unsuspend jika suspended)
 * - Apply upgrade
 */
async function processAfterPayment(invoiceId: string): Promise<void> {
  // Cek renewal request
  const [renewalRows] = await db.execute<RowDataPacket[]>(
    `SELECT srr.*, s.status as server_status, s.pterodactyl_server_id,
            u.email, u.name as user_name
     FROM server_renewal_requests srr
     JOIN servers s ON s.id = srr.server_id
     JOIN users u ON u.id = s.user_id
     WHERE srr.invoice_id = ? AND srr.status = 'pending' LIMIT 1`,
    [invoiceId],
  )

  if (renewalRows[0]) {
    const renewal = renewalRows[0] as {
      id: string; server_id: string; new_active_until: string;
      server_status: string; pterodactyl_server_id: number | null;
      email: string; user_name: string; name?: string
    }

    // Update active_until
    await db.execute(
      `UPDATE server_renewal_requests SET status = 'applied', applied_at = NOW() WHERE id = ?`,
      [renewal.id],
    )
    await db.execute(
      `UPDATE servers SET active_until = ?, updated_at = NOW() WHERE id = ?`,
      [new Date(renewal.new_active_until), renewal.server_id],
    )

    // Unsuspend jika server suspended
    if (renewal.server_status === 'suspended' && renewal.pterodactyl_server_id) {
      try {
        const { unsuspendPterodactylServer } = await import('../pterodactyl/pterodactyl.service.js')
        await unsuspendPterodactylServer(renewal.pterodactyl_server_id)
        await db.execute(
          `UPDATE servers SET status = 'active', suspended_at = NULL, suspend_reason = NULL,
           updated_at = NOW() WHERE id = ?`,
          [renewal.server_id],
        )
        logger.info(`[payment] server ${renewal.server_id} unsuspended after renewal paid`)
      } catch (err) {
        logger.error({ err }, '[payment] unsuspend failed after renewal')
      }
    }

    // Kirim email konfirmasi
    const { sendMail, mailRenewalConfirmed } = await import('../../utils/mailer.js')
    sendMail({
      to: renewal.email,
      subject: 'Pembayaran Dikonfirmasi',
      html: mailRenewalConfirmed(
        renewal.user_name,
        renewal.server_id,
        new Date(renewal.new_active_until).toLocaleDateString('id-ID'),
        'http://localhost:5173/dashboard',
      ),
    })
  }

  // Cek upgrade request
  const [upgradeRows] = await db.execute<RowDataPacket[]>(
    `SELECT spcr.*, s.pterodactyl_server_id, s.pterodactyl_allocation_id
     FROM server_plan_change_requests spcr
     JOIN servers s ON s.id = spcr.server_id
     WHERE spcr.invoice_id = ? AND spcr.status = 'pending'
       AND spcr.change_type = 'upgrade' LIMIT 1`,
    [invoiceId],
  )

  if (upgradeRows[0]) {
    const upgrade = upgradeRows[0] as {
      id: string; server_id: string; to_product_id: string;
      pterodactyl_server_id: number | null; pterodactyl_allocation_id: number | null
    }

    try {
      const [productRows] = await db.execute<RowDataPacket[]>(
        'SELECT * FROM server_products WHERE id = ? LIMIT 1',
        [upgrade.to_product_id],
      )
      const product = productRows[0] as {
        cpu_alloc: string; ram_alloc: string; storage_alloc: string; bandwidth_alloc: string
      } | undefined

      if (product && upgrade.pterodactyl_server_id) {
        const { ensureAllocationId, updatePterodactylServerBuild, parseMB, parseCPU } =
          await import('../pterodactyl/pterodactyl.service.js')

        const allocationId = await ensureAllocationId(
          upgrade.pterodactyl_server_id,
          upgrade.pterodactyl_allocation_id,
        )

        await updatePterodactylServerBuild({
          pteroServerId: upgrade.pterodactyl_server_id,
          allocationId,
          memory: parseMB(product.ram_alloc),
          disk: parseMB(product.storage_alloc),
          cpu: parseCPU(product.cpu_alloc),
        })

        // Update server specs & product_id
        await db.execute(
          `UPDATE server_specs SET cpu_alloc=?, ram_alloc=?, storage_alloc=?, bandwidth_alloc=?,
           updated_at=NOW() WHERE server_id=?`,
          [product.cpu_alloc, product.ram_alloc, product.storage_alloc, product.bandwidth_alloc, upgrade.server_id],
        )
        await db.execute(
          'UPDATE servers SET product_id=?, updated_at=NOW() WHERE id=?',
          [upgrade.to_product_id, upgrade.server_id],
        )
      }

      await db.execute(
        `UPDATE server_plan_change_requests SET status='applied', applied_at=NOW() WHERE id=?`,
        [upgrade.id],
      )
    } catch (err) {
      logger.error({ err }, '[payment] upgrade apply failed')
    }
  }
}
