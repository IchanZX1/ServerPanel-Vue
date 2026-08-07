import { db } from '../../config/db.js'
import type { RowDataPacket } from 'mysql2'
import type { ServerRow, ProductRow } from '../../types/index.js'

export async function getServerById(serverId: string, userId: string): Promise<ServerRow | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM servers WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
    [serverId, userId],
  )
  return (rows[0] as ServerRow) ?? null
}

export async function getServerByIdAdmin(serverId: string): Promise<ServerRow | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM servers WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [serverId],
  )
  return (rows[0] as ServerRow) ?? null
}

export async function getUserServers(userId: string): Promise<ServerRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT s.*, sp.name as product_name, sp.price as product_price
     FROM servers s
     LEFT JOIN server_products sp ON sp.id = s.product_id
     WHERE s.user_id = ? AND s.deleted_at IS NULL AND s.status != 'terminated'
     ORDER BY s.created_at DESC`,
    [userId],
  )
  return rows as ServerRow[]
}

export async function getProductById(productId: string): Promise<ProductRow | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM server_products WHERE id = ? AND is_available = 1 LIMIT 1`,
    [productId],
  )
  return (rows[0] as ProductRow) ?? null
}

export async function getAllProducts(): Promise<ProductRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM server_products WHERE is_available = 1 ORDER BY sort_order ASC`,
  )
  return rows as ProductRow[]
}

export async function getServerSpecs(serverId: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM server_specs WHERE server_id = ? LIMIT 1`,
    [serverId],
  )
  return rows[0] ?? null
}

export async function updateServerAllocationId(
  serverId: string,
  allocationId: number,
): Promise<void> {
  await db.execute(
    'UPDATE servers SET pterodactyl_allocation_id = ?, updated_at = NOW() WHERE id = ?',
    [allocationId, serverId],
  )
}

export async function updateServerStatus(
  serverId: string,
  status: string,
  extra?: { suspended_at?: Date | null; suspend_reason?: string | null },
): Promise<void> {
  const fields: string[] = ['status = ?', 'updated_at = NOW()']
  const values: (string | Date | null)[] = [status]

  if (extra?.suspended_at !== undefined) {
    fields.push('suspended_at = ?')
    values.push(extra.suspended_at)
  }
  if (extra?.suspend_reason !== undefined) {
    fields.push('suspend_reason = ?')
    values.push(extra.suspend_reason)
  }

  values.push(serverId)
  await db.execute(`UPDATE servers SET ${fields.join(', ')} WHERE id = ?`, values)
}

// ─── Renewal ──────────────────────────────────────────────────────────────────

export async function hasPendingRenewal(serverId: string): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id FROM server_renewal_requests WHERE server_id = ? AND status = 'pending' LIMIT 1`,
    [serverId],
  )
  return rows.length > 0
}

export async function createRenewalRequest(data: {
  id: string
  serverId: string
  invoiceId: string
  extendMonths: number
  newActiveUntil: Date
}): Promise<void> {
  await db.execute(
    `INSERT INTO server_renewal_requests
     (id, server_id, invoice_id, extend_months, new_active_until, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [data.id, data.serverId, data.invoiceId, data.extendMonths, data.newActiveUntil],
  )
}

export async function applyRenewal(renewalId: string, serverId: string, newActiveUntil: Date): Promise<void> {
  await db.execute(
    `UPDATE server_renewal_requests
     SET status = 'applied', applied_at = NOW() WHERE id = ?`,
    [renewalId],
  )
  await db.execute(
    `UPDATE servers SET active_until = ?, updated_at = NOW() WHERE id = ?`,
    [newActiveUntil, serverId],
  )
}

// ─── Plan change (upgrade/downgrade) ─────────────────────────────────────────

export async function hasPendingPlanChange(serverId: string): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id FROM server_plan_change_requests
     WHERE server_id = ? AND status IN ('pending','scheduled') LIMIT 1`,
    [serverId],
  )
  return rows.length > 0
}

export async function createPlanChangeRequest(data: {
  id: string
  serverId: string
  changeType: 'upgrade' | 'downgrade'
  fromProductId: string
  toProductId: string
  prorataAmount: number
  invoiceId: string | null
  effectiveDate: Date
  status: 'pending' | 'scheduled'
}): Promise<void> {
  await db.execute(
    `INSERT INTO server_plan_change_requests
     (id, server_id, change_type, from_product_id, to_product_id,
      prorata_amount, invoice_id, effective_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id, data.serverId, data.changeType, data.fromProductId,
      data.toProductId, data.prorataAmount, data.invoiceId,
      data.effectiveDate, data.status,
    ],
  )
}

// ─── Invoice helpers ──────────────────────────────────────────────────────────

export async function createInvoice(data: {
  id: string
  userId: string
  invoiceNumber: string
  subtotal: number
  total: number
  dueDate: Date
}): Promise<void> {
  await db.execute(
    `INSERT INTO invoices
     (id, user_id, invoice_number, status, subtotal, discount, tax, total, due_date)
     VALUES (?, ?, ?, 'pending', ?, 0, 0, ?, ?)`,
    [data.id, data.userId, data.invoiceNumber, data.subtotal, data.total, data.dueDate],
  )
}

export async function createInvoiceItem(data: {
  id: string
  invoiceId: string
  productId: string
  serverId: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}): Promise<void> {
  await db.execute(
    `INSERT INTO invoice_items
     (id, invoice_id, product_id, server_id, description, quantity, unit_price, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id, data.invoiceId, data.productId, data.serverId,
      data.description, data.quantity, data.unitPrice, data.total,
    ],
  )
}

export async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM invoices WHERE YEAR(created_at) = ?`,
    [year],
  )
  const count = ((rows[0] as { count: number }).count) + 1
  return `INV-${year}-${String(count).padStart(4, '0')}`
}
