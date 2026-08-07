import { db } from '../../config/db.js'
import type { RowDataPacket } from 'mysql2'

export async function getUserInvoices(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT i.id, i.invoice_number, i.status, i.subtotal, i.discount, i.tax, i.total,
            i.payment_method, i.paid_at, i.due_date, i.voucher_code,
            i.voucher_discount_amount, i.created_at,
            (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as item_count
     FROM invoices i
     WHERE i.user_id = ?
     ORDER BY i.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset],
  )
  const [countRows] = await db.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as total FROM invoices WHERE user_id = ?',
    [userId],
  )
  return {
    invoices: rows,
    total: (countRows[0] as { total: number }).total,
    page,
    limit,
  }
}

export async function getInvoiceDetail(invoiceId: string, userId: string) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT i.*, p.order_id, p.inv_id, p.amount as payment_amount,
            p.status as payment_status, p.created_at as payment_created_at
     FROM invoices i
     LEFT JOIN payments p ON p.id = i.active_payment_id
     WHERE i.id = ? AND i.user_id = ? LIMIT 1`,
    [invoiceId, userId],
  )
  if (!rows[0]) return null

  const [items] = await db.execute<RowDataPacket[]>(
    `SELECT ii.*, sp.name as product_name
     FROM invoice_items ii
     LEFT JOIN server_products sp ON sp.id = ii.product_id
     WHERE ii.invoice_id = ?`,
    [invoiceId],
  )

  return { invoice: rows[0], items }
}
