import type { Request, Response } from 'express'
import * as service from './payment.service.js'
import { ok, fail } from '../../utils/responseBuilder.js'
import { z } from 'zod'

const createSchema = z.object({
  invoiceId: z.string().uuid(),
})

const statusSchema = z.object({
  paymentId: z.string().uuid(),
})

const qrisSchema = z.object({
  invoiceId: z.string().uuid(),
})

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, 'invoiceId tidak valid', 422)
      return
    }

    // Ambil detail invoice untuk verifikasi ownership + amount
    const { db } = await import('../../config/db.js')
    const [rows] = await db.execute(
      `SELECT id, user_id, total, invoice_number, status FROM invoices WHERE id = ? LIMIT 1`,
      [parsed.data.invoiceId],
    ) as [Array<{ id: string; user_id: string; total: number; invoice_number: string; status: string }>, unknown]

    const invoice = rows[0]
    if (!invoice || invoice.user_id !== req.user!.sub) {
      fail(res, 'Invoice tidak ditemukan', 404)
      return
    }
    if (invoice.status === 'paid') {
      fail(res, 'Invoice sudah dibayar', 400)
      return
    }

    const result = await service.createSociabuzzPayment({
      invoiceId: invoice.id,
      userId: req.user!.sub,
      amount: invoice.total,
      description: `Pembayaran ${invoice.invoice_number}`,
    })

    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}

export async function status(req: Request, res: Response): Promise<void> {
  try {
    const parsed = statusSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, 'paymentId tidak valid', 422)
      return
    }
    const result = await service.checkPaymentStatus(parsed.data.paymentId, req.user!.sub)
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message)
  }
}

export async function qris(req: Request, res: Response): Promise<void> {
  try {
    const parsed = qrisSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, 'invoiceId tidak valid', 422)
      return
    }
    const qrBase64 = await service.getQrString(parsed.data.invoiceId)
    if (!qrBase64) {
      fail(res, 'QR tidak ditemukan atau sudah expired', 404)
      return
    }
    ok(res, { qrBase64 })
  } catch (err) {
    fail(res, (err as Error).message)
  }
}
