import { db } from '../../config/db.js'
import type { RowDataPacket } from 'mysql2'

export interface VoucherRow {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase: number
  max_discount: number | null
  usage_limit: number | null
  usage_count: number
  valid_from: string
  valid_until: string
  is_active: number
}

export async function findActiveVoucher(code: string): Promise<VoucherRow | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, code, type, value, min_purchase, max_discount,
            usage_limit, usage_count, valid_from, valid_until, is_active
     FROM vouchers
     WHERE code = ? AND is_active = 1
     LIMIT 1`,
    [code.toUpperCase().trim()],
  )
  return (rows[0] as VoucherRow) ?? null
}

export async function incrementUsageCount(voucherId: string): Promise<void> {
  await db.execute(
    'UPDATE vouchers SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = ?',
    [voucherId],
  )
}
