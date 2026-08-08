import { v4 as uuid } from 'uuid'
import QRCode from 'qrcode'
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
  paymentType?: 'new_order' | 'renewal' | 'upgrade'
}): Promise<{
  paymentId: string
  orderId: string
  invId: string
  redirectUrl: string
  qrBase64: string | null
  expiredAt: string
}> {
  const orderId = `PSV2-${uuid().slice(0, 8).toUpperCase()}`

  const [userRows] = await db.execute<RowDataPacket[]>(
    `SELECT name, username, email FROM users WHERE id = ? LIMIT 1`,
    [data.userId],
  )
  const user = userRows[0] as { name: string; username: string; email: string } | undefined
  if (!user) throw new Error('User tidak ditemukan')

  const res = await fetch(`${env.MAELYN_BASE_URL}/payment/sociabuzz/create/payment`, {
    method: 'POST',
    headers: {
      'x-maelyn-auth': env.MAELYN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: env.MAELYN_SOCIABUZZ_USERNAME,
      fullname: user.name,
      email: user.email,
      amount: data.amount,
      description: data.description,
    }),
  })

  if (!res.ok) {
    const raw = await res.text()
    let message = `Maelyn createPayment failed: ${res.status}`
    try {
      const body = JSON.parse(raw) as { message?: string }
      if (body.message) message = `Maelyn: ${body.message}`
    } catch { /* ignore non-JSON */ }
    throw new Error(message)
  }

  const json = await res.json() as {
    success: boolean
    payment: {
      order_id: string
      inv_id: string
      amount: string
      qr_string: string
      expiration_date: string
      expired_at: number | string
      redirect_url: string
    }
  }

  const payment = json.payment
  // Masa aktif pembayaran dikunci ketat 3 menit (180 detik), apapun expiry dari Maelyn
  const PAYMENT_TTL_SECONDS = 180
  const maelynTtl = typeof payment.expired_at === 'number'
    ? payment.expired_at
    : Math.max(Math.floor((new Date(payment.expired_at).getTime() - Date.now()) / 1000), 60)
  const ttl = Math.min(maelynTtl, PAYMENT_TTL_SECONDS)
  const expiredAt = new Date(Date.now() + ttl * 1000)

  // Simpan qr_string (konten QRIS mentah) di Redis dengan TTL; PNG QR dibuat on-demand.
  let qrBase64: string | null = null
  if (payment.qr_string) {
    await safeRedisSet(`qr:${data.invoiceId}`, payment.qr_string, ttl)
    try {
      qrBase64 = await QRCode.toDataURL(payment.qr_string)
    } catch (err) {
      logger.error({ err }, '[payment] qr encode failed')
    }
  }

  // Simpan payment ke DB
  const paymentId = uuid()
  await db.execute(
    `INSERT INTO payments
     (id, invoice_id, user_id, order_id, inv_id, amount, redirect_url, status, poll_count, payment_type, expired_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    [
      paymentId, data.invoiceId, data.userId, orderId, payment.inv_id,
      data.amount, payment.redirect_url, data.paymentType ?? 'new_order', expiredAt,
    ],
  )

  // Update invoice.active_payment_id
  await db.execute(
    'UPDATE invoices SET active_payment_id = ?, updated_at = NOW() WHERE id = ?',
    [paymentId, data.invoiceId],
  )

  return {
    paymentId,
    orderId,
    invId: payment.inv_id,
    redirectUrl: payment.redirect_url,
    qrBase64,
    expiredAt: expiredAt.toISOString(),
  }
}

export async function getQrString(invoiceId: string): Promise<string | null> {
  const qrString = await safeRedisGet(`qr:${invoiceId}`)
  if (!qrString) return null
  try {
    return await QRCode.toDataURL(qrString)
  } catch (err) {
    logger.error({ err, invoiceId }, '[payment] qr encode failed')
    return null
  }
}

export async function checkPaymentStatus(paymentId: string, userId: string): Promise<{
  paymentId: string
  status: string
  amount: number
  paidAt: string | null
  provision: unknown
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
    redirect_url: string; invoice_id: string; poll_count: number; expired_at: string
  } | undefined

  if (!payment) throw new Error('Payment tidak ditemukan')

  // Jika masa aktif (3 menit) sudah lewat, tandai expired — tanpa perlu polling
  if (payment.status === 'pending' && new Date(payment.expired_at) <= new Date()) {
    await db.execute(
      `UPDATE payments SET status = 'expired', updated_at = NOW() WHERE id = ? AND status = 'pending'`,
      [payment.id],
    )
    payment.status = 'expired'
  }

  // Jika masih pending — poll Maelyn
  if (payment.status === 'pending') {
    await pollPaymentStatus(payment.id, payment.invoice_id, payment.redirect_url, payment.poll_count)
    const [updatedRows] = await db.execute<RowDataPacket[]>(
      'SELECT id, status, amount, paid_at, invoice_id FROM payments WHERE id = ? LIMIT 1',
      [paymentId],
    )
    const updated = updatedRows[0] as {
      id: string; status: string; amount: number; paid_at: string | null; invoice_id: string
    }
    return {
      paymentId: updated.id,
      status: updated.status,
      amount: updated.amount,
      paidAt: updated.paid_at,
      provision: updated.status === 'paid' ? await getProvisionResult(updated.invoice_id) : null,
    }
  }

  return {
    paymentId: payment.id,
    status: payment.status,
    amount: payment.amount,
    paidAt: payment.paid_at,
    provision: payment.status === 'paid' ? await getProvisionResult(payment.invoice_id) : null,
  }
}

async function getProvisionResult(invoiceId: string): Promise<unknown> {
  const raw = await safeRedisGet(`order-result:${invoiceId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
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

    // Deteksi status dari <title> halaman — sesuai docs/mission/architecture-system-sociabuzz.md
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] ?? ''
    const paid = /payment successful/i.test(title)
    const expired = /link expired/i.test(title)

    const newPollCount = currentPollCount + 1

    // 3 menit masa aktif → maksimal 18 polling (10 detik sekali)
    const MAX_POLLS = 18

    if (paid) {
      await markPaymentPaid(paymentId, invoiceId)
    } else if (expired || newPollCount >= MAX_POLLS) {
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
 * - Provision server baru (new_order)
 * - Apply renewal (unsuspend jika suspended)
 * - Apply upgrade
 */
async function processAfterPayment(invoiceId: string): Promise<void> {
  await processNewOrder(invoiceId)

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

/**
 * Provision server baru untuk invoice pembelian (invoice_items.server_id masih NULL).
 * Hasil provisioning disimpan sementara di Redis agar bisa diambil frontend.
 */
async function processNewOrder(invoiceId: string): Promise<void> {
  const [invRows] = await db.execute<RowDataPacket[]>(
    'SELECT user_id FROM invoices WHERE id = ? LIMIT 1',
    [invoiceId],
  )
  const invoice = invRows[0] as { user_id: string } | undefined
  if (!invoice) return

  const [itemRows] = await db.execute<RowDataPacket[]>(
    `SELECT ii.id, ii.product_id, ii.quantity, ii.description
     FROM invoice_items ii
     WHERE ii.invoice_id = ? AND ii.server_id IS NULL LIMIT 1`,
    [invoiceId],
  )
  const item = itemRows[0] as {
    id: string; product_id: string; quantity: number; description: string
  } | undefined
  if (!item) return

  const nameMatch = item.description.match(/"([^"]+)"/)
  const serverName = nameMatch ? nameMatch[1] : item.description.split(' — ')[0].trim()

  try {
    const { provisionNewServer } = await import('../pterodactyl/provision.service.js')
    const result = await provisionNewServer({
      userId: invoice.user_id,
      productId: item.product_id,
      name: serverName,
      months: item.quantity,
    })

    await db.execute(
      'UPDATE invoice_items SET server_id = ?, updated_at = NOW() WHERE id = ?',
      [result.serverId, item.id],
    )

    await safeRedisSet(`order-result:${invoiceId}`, JSON.stringify(result), 86400)

    const [userRows] = await db.execute<RowDataPacket[]>(
      'SELECT email, name FROM users WHERE id = ? LIMIT 1',
      [invoice.user_id],
    )
    const user = userRows[0] as { email: string; name: string } | undefined

    if (user) {
      const { sendMail, mailNewServerProvisioned } = await import('../../utils/mailer.js')
      sendMail({
        to: user.email,
        subject: 'Server Baru Aktif',
        html: mailNewServerProvisioned(
          user.name,
          result.name,
          result.ipAddress,
          result.activeUntil,
          'http://localhost:5173/dashboard',
        ),
      })
    }
  } catch (err) {
    logger.error({ err, invoiceId }, '[payment] new-order provision failed')
  }
}
