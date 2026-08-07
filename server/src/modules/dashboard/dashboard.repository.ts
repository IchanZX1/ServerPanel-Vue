import { db } from '../../config/db.js'
import type { RowDataPacket } from 'mysql2'
import type { ServerRow, ProductRow } from '../../types/index.js'

export async function getDashboardStats(userId: string) {
  const [activeRows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM servers
     WHERE user_id = ? AND status = 'active' AND deleted_at IS NULL`,
    [userId],
  )
  const [suspendedRows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM servers
     WHERE user_id = ? AND status = 'suspended' AND deleted_at IS NULL`,
    [userId],
  )
  const [txRows] = await db.execute<RowDataPacket[]>(
    `SELECT COALESCE(SUM(total), 0) as total FROM invoices
     WHERE user_id = ? AND status = 'paid'`,
    [userId],
  )
  return {
    activeServers: (activeRows[0] as { count: number }).count,
    suspendedServers: (suspendedRows[0] as { count: number }).count,
    totalTransactions: Number((txRows[0] as { total: string }).total),
  }
}

export async function getUserServers(userId: string): Promise<ServerRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT s.id, s.user_id, s.product_id, s.name, s.status,
            s.node_version, s.storage_type, s.ip_address,
            s.active_until, s.suspended_at, s.created_at
     FROM servers s
     WHERE s.user_id = ? AND s.deleted_at IS NULL AND s.status != 'terminated'
     ORDER BY s.created_at DESC`,
    [userId],
  )
  return rows as ServerRow[]
}

export async function getAvailableProducts(): Promise<ProductRow[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, name, badge, price, billing_period,
            cpu_alloc, ram_alloc, storage_alloc, bandwidth_alloc,
            node_version, storage_type
     FROM server_products
     WHERE is_available = 1
     ORDER BY sort_order ASC`,
  )
  return rows as ProductRow[]
}
