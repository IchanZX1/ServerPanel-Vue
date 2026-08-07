import type { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { db } from '../../config/db.js'
import { ok, fail } from '../../utils/responseBuilder.js'
import {
  createInvoice,
  createInvoiceItem,
  getNextInvoiceNumber,
  getProductById,
} from '../server/server.repository.js'
import { createSociabuzzPayment } from '../payment/payment.service.js'

const createSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(150),
  months: z.number().int().min(1).max(24),
})

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, parsed.error.errors[0]?.message ?? 'Input tidak valid', 422)
      return
    }

    const product = await getProductById(parsed.data.productId)
    if (!product) {
      fail(res, 'Produk tidak ditemukan', 404)
      return
    }

    const userId = req.user!.sub
    const months = parsed.data.months
    const total = product.price * months
    const serverName = parsed.data.name

    // Cek tidak ada invoice pembelian baru yang belum dibayar
    const [pendingRows] = await db.execute(
      `SELECT i.id FROM invoices i
       JOIN invoice_items ii ON ii.invoice_id = i.id
       WHERE i.user_id = ? AND i.status = 'pending' AND ii.server_id IS NULL
       LIMIT 1`,
      [userId],
    ) as [Array<{ id: string }>, unknown]
    if (pendingRows[0]) {
      fail(res, 'Anda masih memiliki pembayaran yang belum selesai', 409)
      return
    }

    // Buat invoice pending + item (server belum diprovision)
    const invoiceId = uuid()
    const invoiceNumber = await getNextInvoiceNumber()
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await createInvoice({
      id: invoiceId,
      userId,
      invoiceNumber,
      subtotal: total,
      total,
      dueDate,
    })

    await createInvoiceItem({
      id: uuid(),
      invoiceId,
      productId: product.id,
      serverId: null,
      description: `Pembelian server "${serverName}" — ${months} bulan`,
      quantity: months,
      unitPrice: product.price,
      total,
    })

    // Buat payment Maelyn (QRIS)
    const result = await createSociabuzzPayment({
      invoiceId,
      userId,
      amount: total,
      description: `Pembayaran ${invoiceNumber}`,
      paymentType: 'new_order',
    })

    ok(res, {
      invoiceId,
      invoiceNumber,
      productId: product.id,
      productName: product.name,
      name: serverName,
      months,
      total,
      ...result,
    })
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}
