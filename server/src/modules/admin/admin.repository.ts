import { db } from '../../config/db.js'
import { safeRedisGet, safeRedisSet, safeRedisDel } from '../../config/redis.js'
import { hashPassword } from '../../utils/password.js'
import { v4 as uuid } from 'uuid'
import type { RowDataPacket } from 'mysql2'

const SESSION_TTL = 8 * 60 * 60 // 8 jam dalam detik
const SESSION_PREFIX = 'admin:session:'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function findAdminByEmail(email: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT id, email, password_hash, name FROM admin_users WHERE email = ? LIMIT 1',
    [email],
  )
  return (rows[0] as { id: string; email: string; password_hash: string; name: string }) ?? null
}

export async function createAdminSession(adminId: string, adminEmail: string): Promise<string> {
  const sessionId = uuid()
  await safeRedisSet(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify({ adminId, adminEmail, createdAt: Date.now() }),
    SESSION_TTL,
  )
  return sessionId
}

export async function getAdminSession(sessionId: string) {
  const data = await safeRedisGet(`${SESSION_PREFIX}${sessionId}`)
  if (!data) return null
  return JSON.parse(data) as { adminId: string; adminEmail: string; createdAt: number }
}

export async function destroyAdminSession(sessionId: string): Promise<void> {
  await safeRedisDel(`${SESSION_PREFIX}${sessionId}`)
}

export async function updateAdminPassword(adminId: string, newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword)
  await db.execute(
    'UPDATE admin_users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [hash, adminId],
  )
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [[users], [servers], [suspended], [revenue], [pendingInvoices], [tickets]] =
    await Promise.all([
      db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL AND role = "customer"'),
      db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM servers WHERE status = "active" AND deleted_at IS NULL'),
      db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM servers WHERE status = "suspended" AND deleted_at IS NULL'),
      db.execute<RowDataPacket[]>('SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE status = "paid"'),
      db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM invoices WHERE status = "pending"'),
      db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM contact_tickets WHERE status = "open"'),
    ])

  return {
    totalUsers: (users[0] as { count: number }).count,
    activeServers: (servers[0] as { count: number }).count,
    suspendedServers: (suspended[0] as { count: number }).count,
    totalRevenue: Number((revenue[0] as { total: string }).total),
    pendingInvoices: (pendingInvoices[0] as { count: number }).count,
    openTickets: (tickets[0] as { count: number }).count,
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit
  const where = search ? `AND (u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)` : ''
  const params: (string | number)[] = search
    ? [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset]
    : [limit, offset]

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT u.id, u.name, u.username, u.email, u.is_active, u.created_at,
            COUNT(s.id) as server_count
     FROM users u
     LEFT JOIN servers s ON s.user_id = u.id AND s.deleted_at IS NULL
     WHERE u.deleted_at IS NULL AND u.role = 'customer' ${where}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  )

  const [countRows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL AND role = 'customer'`,
  )

  return {
    users: rows,
    total: (countRows[0] as { total: number }).total,
    page,
    limit,
  }
}

export async function getUserDetail(userId: string) {
  const [userRows] = await db.execute<RowDataPacket[]>(
    `SELECT id, name, username, email, is_active, created_at, pterodactyl_user_id
     FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [userId],
  )
  if (!userRows[0]) return null

  const [servers] = await db.execute<RowDataPacket[]>(
    `SELECT s.id, s.name, s.status, s.active_until, s.suspended_at,
            sp.name as product_name
     FROM servers s
     LEFT JOIN server_products sp ON sp.id = s.product_id
     WHERE s.user_id = ? AND s.deleted_at IS NULL
     ORDER BY s.created_at DESC`,
    [userId],
  )

  return { user: userRows[0], servers }
}

export async function softDeleteUser(userId: string): Promise<void> {
  await db.execute(
    'UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?',
    [userId],
  )
}

// ─── Servers ──────────────────────────────────────────────────────────────────

export async function getAllServers(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit
  const where = search ? `AND (s.name LIKE ? OR u.email LIKE ?)` : ''
  const params: (string | number)[] = search
    ? [`%${search}%`, `%${search}%`, limit, offset]
    : [limit, offset]

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT s.id, s.name, s.status, s.active_until, s.suspended_at, s.ip_address,
            s.pterodactyl_server_id, s.suspend_reason,
            u.name as user_name, u.email as user_email,
            sp.name as product_name
     FROM servers s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN server_products sp ON sp.id = s.product_id
     WHERE s.deleted_at IS NULL ${where}
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    params,
  )

  const [countRows] = await db.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as total FROM servers WHERE deleted_at IS NULL',
  )

  return {
    servers: rows,
    total: (countRows[0] as { total: number }).total,
    page,
    limit,
  }
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function getAllInvoices(page: number, limit: number) {
  const offset = (page - 1) * limit
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT i.id, i.invoice_number, i.status, i.total, i.paid_at,
            i.due_date, i.created_at,
            u.name as user_name, u.email as user_email
     FROM invoices i
     JOIN users u ON u.id = i.user_id
     ORDER BY i.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  )
  const [countRows] = await db.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as total FROM invoices',
  )
  return {
    invoices: rows,
    total: (countRows[0] as { total: number }).total,
    page,
    limit,
  }
}

export async function confirmInvoicePaid(invoiceId: string): Promise<void> {
  await db.execute(
    `UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ?`,
    [invoiceId],
  )
  // Proses setelah payment paid
  const { markPaymentPaid } = await import('../payment/payment.service.js')
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT id FROM payments WHERE invoice_id = ? AND status = "pending" LIMIT 1',
    [invoiceId],
  )
  const payment = rows[0] as { id: string } | undefined
  if (payment) {
    await markPaymentPaid(payment.id, invoiceId)
  } else {
    // Tidak ada payment record — proses langsung
    const { processAfterPaymentAdmin } = await import('./admin.service.js')
    await processAfterPaymentAdmin(invoiceId)
  }
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export async function getAllTickets(page: number, limit: number) {
  const offset = (page - 1) * limit
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT ct.id, ct.ticket_number, ct.subject, ct.category, ct.status,
            ct.priority, ct.created_at,
            u.name as user_name, u.email as user_email
     FROM contact_tickets ct
     JOIN users u ON u.id = ct.user_id
     ORDER BY ct.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  )
  const [countRows] = await db.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as total FROM contact_tickets',
  )
  return {
    tickets: rows,
    total: (countRows[0] as { total: number }).total,
    page,
    limit,
  }
}

export async function replyTicket(
  ticketId: string,
  adminId: string,
  message: string,
): Promise<void> {
  const replyId = uuid()
  await db.execute(
    `INSERT INTO ticket_replies (id, ticket_id, user_id, message, is_admin_reply)
     VALUES (?, ?, ?, ?, 1)`,
    [replyId, ticketId, adminId, message],
  )
  await db.execute(
    `UPDATE contact_tickets SET status = 'in_progress', updated_at = NOW() WHERE id = ?`,
    [ticketId],
  )
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getAllProductsAdmin() {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT * FROM server_products ORDER BY sort_order ASC',
  )
  return rows
}

export async function createProduct(data: {
  name: string; badge: string | null; price: number; billingPeriod: string
  cpuAlloc: number; ramAlloc: number; storageAlloc: number; bandwidthAlloc: string
  nodeVersion: string; storageType: string; sortOrder: number
}): Promise<void> {
  await db.execute(
    `INSERT INTO server_products
     (id, name, badge, price, billing_period, cpu_alloc, ram_alloc,
      storage_alloc, bandwidth_alloc, node_version, storage_type, is_available, sort_order)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [data.name, data.badge, data.price, data.billingPeriod, data.cpuAlloc,
     data.ramAlloc, data.storageAlloc, data.bandwidthAlloc,
     data.nodeVersion, data.storageType, data.sortOrder],
  )
}

export async function updateProduct(id: string, data: Partial<{
  name: string; badge: string | null; price: number; cpuAlloc: string
  ramAlloc: string; storageAlloc: string; bandwidthAlloc: string
  nodeVersion: string; storageType: string; isAvailable: number; sortOrder: number
}>): Promise<void> {
  const fieldMap: Record<string, string> = {
    name: 'name', badge: 'badge', price: 'price',
    cpuAlloc: 'cpu_alloc', ramAlloc: 'ram_alloc',
    storageAlloc: 'storage_alloc', bandwidthAlloc: 'bandwidth_alloc',
    nodeVersion: 'node_version', storageType: 'storage_type',
    isAvailable: 'is_available', sortOrder: 'sort_order',
  }
  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, val] of Object.entries(data)) {
    if (fieldMap[key]) {
      fields.push(`${fieldMap[key]} = ?`)
      values.push(val)
    }
  }
  if (!fields.length) return
  values.push(id)
  await db.execute(
    `UPDATE server_products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
    values as (string | number | null)[],
  )
}

// ─── Vouchers ─────────────────────────────────────────────────────────────────

export async function getAllVouchers() {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT v.*, a.name as created_by_name
     FROM vouchers v
     LEFT JOIN admin_users a ON a.id = v.created_by
     ORDER BY v.created_at DESC`,
  )
  return rows
}

export async function createVoucher(data: {
  code: string; type: 'percentage' | 'fixed'; value: number
  minPurchase: number; maxDiscount: number | null; usageLimit: number | null
  validFrom: Date; validUntil: Date; adminId: string
}): Promise<void> {
  await db.execute(
    `INSERT INTO vouchers
     (id, code, type, value, min_purchase, max_discount, usage_limit,
      valid_from, valid_until, is_active, created_by)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [data.code.toUpperCase(), data.type, data.value, data.minPurchase,
     data.maxDiscount, data.usageLimit, data.validFrom, data.validUntil, data.adminId],
  )
}

export async function toggleVoucher(id: string): Promise<void> {
  await db.execute(
    'UPDATE vouchers SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?',
    [id],
  )
}

export async function deleteVoucher(id: string): Promise<{ deleted: boolean; reason?: string }> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT usage_count FROM vouchers WHERE id = ? LIMIT 1',
    [id],
  )
  const voucher = rows[0] as { usage_count: number } | undefined
  if (!voucher) return { deleted: false, reason: 'Voucher tidak ditemukan' }
  if (voucher.usage_count > 0) {
    return { deleted: false, reason: 'Voucher sudah pernah digunakan, tidak bisa dihapus' }
  }
  await db.execute('DELETE FROM vouchers WHERE id = ?', [id])
  return { deleted: true }
}
