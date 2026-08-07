import type { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { db } from '../../config/db.js'
import { env } from '../../config/env.js'
import { ok, fail } from '../../utils/responseBuilder.js'
import { encrypt } from '../../utils/crypto.js'
import { logger } from '../../utils/logger.js'
import type { RowDataPacket } from 'mysql2'
import {
  createPterodactylUser,
  createPterodactylServer,
  getAvailableAllocation,
  sanitizePteroUsername,
  sanitizePteroName,
  parseMB,
  parseCPU,
} from '../pterodactyl/pterodactyl.service.js'

const provisionSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1).max(150).optional(),
  months: z.number().int().min(1).max(24).optional(),
})

function generatePanelPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 16; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

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
    const [userRows] = await db.execute<RowDataPacket[]>(
      `SELECT id, name, username, email, pterodactyl_user_id
       FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [userId],
    )
    const user = userRows[0] as {
      id: string; name: string; username: string; email: string; pterodactyl_user_id: number | null
    } | undefined
    if (!user) {
      fail(res, 'User tidak ditemukan', 404)
      return
    }

    const [productRows] = parsed.data.productId
      ? await db.execute<RowDataPacket[]>(
          `SELECT * FROM server_products WHERE id = ? AND is_available = 1 LIMIT 1`,
          [parsed.data.productId],
        )
      : await db.execute<RowDataPacket[]>(
          `SELECT * FROM server_products WHERE is_available = 1 ORDER BY sort_order ASC LIMIT 1`,
        )
    const product = productRows[0] as {
      id: string; name: string; badge: string | null; price: number; billing_period: string
      cpu_alloc: number; ram_alloc: number; storage_alloc: number; bandwidth_alloc: string
      node_version: string | null; storage_type: string | null
    } | undefined
    if (!product) {
      fail(res, 'Produk tidak ditemukan', 404)
      return
    }

    // 1) Ensure Pterodactyl user
    const pteroUsername = sanitizePteroUsername(user.username)
    let pteroUserId = user.pterodactyl_user_id
    if (!pteroUserId) {
      const nameParts = user.name.split(/\s+/)
      const pteroUser = await createPterodactylUser({
        email: user.email,
        username: pteroUsername,
        firstName: sanitizePteroName(nameParts[0] ?? '', user.username),
        lastName: sanitizePteroName(nameParts.slice(1).join(' ') || '-', user.username),
        password: generatePanelPassword(),
      })
      pteroUserId = pteroUser.id
      await db.execute(
        'UPDATE users SET pterodactyl_user_id = ?, updated_at = NOW() WHERE id = ?',
        [pteroUserId, user.id],
      )
    }

    // 2) Get free allocation & create Pterodactyl server
    const allocation = await getAvailableAllocation(parseInt(env.PTERO_NODE_ID, 10))
    const pteroServer = await createPterodactylServer({
      name: parsed.data.name ?? `${product.name} Server`,
      pteroUserId,
      memory: parseMB(String(product.ram_alloc)),
      disk: parseMB(String(product.storage_alloc)),
      cpu: parseCPU(String(product.cpu_alloc)),
      allocationId: allocation.id,
    })

    // 3) Persist ke DB
    const serverId = uuid()
    const panelPassword = generatePanelPassword()
    const activeUntil = new Date()
    activeUntil.setMonth(activeUntil.getMonth() + (parsed.data.months ?? 1))
    activeUntil.setHours(23, 59, 59, 999)

    const invoiceId = uuid()
    const invoiceNumber = await getNextInvoiceNumber()
    const total = product.price * (parsed.data.months ?? 1)
    const productName = parsed.data.name ?? `${product.name} Server`

    await db.execute(
      `INSERT INTO servers
       (id, user_id, product_id, name, status, node_version, storage_type,
        ip_address, panel_username, panel_password_enc, active_until,
        pterodactyl_user_id, pterodactyl_server_id, pterodactyl_allocation_id)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serverId, user.id, product.id, productName,
        product.node_version, product.storage_type,
        `${allocation.ip}:${allocation.port}`,
        pteroUsername, encrypt(panelPassword), activeUntil,
        pteroUserId, pteroServer.id, allocation.id,
      ],
    )

    await db.execute(
      `INSERT INTO server_specs
       (id, server_id, cpu_alloc, ram_alloc, storage_alloc, bandwidth_alloc)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuid(), serverId,
        `${product.cpu_alloc}% CPU Allocation`,
        `${product.ram_alloc} MB RAM Allocation`,
        `${product.storage_alloc} MB Storage`,
        product.bandwidth_alloc,
      ],
    )

    await db.execute(
      `INSERT INTO invoices
       (id, user_id, invoice_number, status, subtotal, discount, tax, total, payment_method, paid_at, due_date)
       VALUES (?, ?, ?, 'paid', ?, 0, 0, ?, 'dev', NOW(), ?)`,
      [invoiceId, user.id, invoiceNumber, total, total, activeUntil],
    )

    await db.execute(
      `INSERT INTO invoice_items
       (id, invoice_id, product_id, server_id, description, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid(), invoiceId, product.id, serverId,
        `Dev provision: ${productName} — ${parsed.data.months ?? 1} bulan`,
        parsed.data.months ?? 1, product.price, total,
      ],
    )

    logger.info(`[dev] server ${serverId} provisioned for user ${user.id}`)

    ok(res, {
      serverId,
      name: productName,
      pterodactylServerId: pteroServer.id,
      pterodactylIdentifier: pteroServer.identifier,
      status: 'active',
      nodeVersion: product.node_version,
      storageType: product.storage_type,
      ipAddress: `${allocation.ip}:${allocation.port}`,
      activeUntil: activeUntil.toISOString().split('T')[0],
      specs: {
        cpu: product.cpu_alloc,
        ram: product.ram_alloc,
        storage: product.storage_alloc,
        bandwidth: product.bandwidth_alloc,
      },
      credentials: {
        panelUrl: env.PTERO_BASE_URL,
        username: pteroUsername,
        password: panelPassword,
      },
      invoice: { invoiceId, invoiceNumber, total },
      note: 'DEV ONLY — server dibuat tanpa pembayaran',
    })
  } catch (err) {
    logger.error({ err }, '[dev] provision failed')
    fail(res, (err as Error).message, 500)
  }
}
