import type { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { db } from '../../config/db.js'
import { ok, fail } from '../../utils/responseBuilder.js'
import { logger } from '../../utils/logger.js'
import type { RowDataPacket } from 'mysql2'
import { provisionNewServer } from '../pterodactyl/provision.service.js'

const provisionSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1).max(150).optional(),
  months: z.number().int().min(1).max(24).optional(),
})

async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM invoices WHERE YEAR(created_at) = ?',
    [year],
  )
  const count = ((rows[0] as { count: number }).count) + 1
  return `INV-${year}-${String(count).padStart(4, '0')}`
}

export async function provisionServer(req: Request, res: Response): Promise<void> {
  try {
    const parsed = provisionSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      fail(res, parsed.error.errors[0]?.message ?? 'Input tidak valid', 422)
      return
    }

    const userId = req.user!.sub

    // Pilih produk (default: termurah)
    const [productRows] = parsed.data.productId
      ? await db.execute<RowDataPacket[]>(
          `SELECT id, name, price, cpu_alloc, ram_alloc, storage_alloc, bandwidth_alloc,
                  node_version, storage_type
           FROM server_products WHERE id = ? AND is_available = 1 LIMIT 1`,
          [parsed.data.productId],
        )
      : await db.execute<RowDataPacket[]>(
          `SELECT id, name, price, cpu_alloc, ram_alloc, storage_alloc, bandwidth_alloc,
                  node_version, storage_type
           FROM server_products WHERE is_available = 1 ORDER BY sort_order ASC LIMIT 1`,
        )
    const product = productRows[0] as unknown as {
      id: string; name: string; price: number
      cpu_alloc: number; ram_alloc: number; storage_alloc: number; bandwidth_alloc: string
      node_version: string | null; storage_type: string | null
    } | undefined
    if (!product) {
      fail(res, 'Produk tidak ditemukan', 404)
      return
    }

    const months = parsed.data.months ?? 1
    const productName = parsed.data.name ?? `${product.name} Server`

    const result = await provisionNewServer({
      userId,
      productId: product.id,
      name: productName,
      months,
    })

    // Buat invoice 'paid' (dev)
    const invoiceId = uuid()
    const invoiceNumber = await getNextInvoiceNumber()
    const total = product.price * months

    await db.execute(
      `INSERT INTO invoices
       (id, user_id, invoice_number, status, subtotal, discount, tax, total, payment_method, paid_at, due_date)
       VALUES (?, ?, ?, 'paid', ?, 0, 0, ?, 'dev', NOW(), ?)`,
      [invoiceId, userId, invoiceNumber, total, total, new Date(result.activeUntil)],
    )

    await db.execute(
      `INSERT INTO invoice_items
       (id, invoice_id, product_id, server_id, description, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid(), invoiceId, product.id, result.serverId,
        `Dev provision: ${productName} — ${months} bulan`,
        months, product.price, total,
      ],
    )

    logger.info(`[dev] server ${result.serverId} provisioned for user ${userId}`)

    ok(res, {
      serverId: result.serverId,
      name: result.name,
      pterodactylServerId: result.pterodactylServerId,
      pterodactylIdentifier: result.pterodactylIdentifier,
      status: result.status,
      nodeVersion: result.nodeVersion,
      storageType: result.storageType,
      ipAddress: result.ipAddress,
      activeUntil: result.activeUntil,
      specs: result.specs,
      credentials: result.credentials,
      invoice: { invoiceId, invoiceNumber, total },
      note: 'DEV ONLY — server dibuat tanpa pembayaran',
    })
  } catch (err) {
    logger.error({ err }, '[dev] provision failed')
    fail(res, (err as Error).message, 500)
  }
}
