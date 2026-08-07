import type { Request, Response } from 'express'
import { ok, fail } from '../../utils/responseBuilder.js'
import * as repo from './voucher.repository.js'
import { z } from 'zod'

const validateSchema = z.object({
  code: z.string().min(1).max(50),
  invoiceAmount: z.number().positive(),
})

export async function validate(req: Request, res: Response): Promise<void> {
  try {
    const parsed = validateSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, parsed.error.errors[0]?.message ?? 'Input tidak valid', 422)
      return
    }

    const { code, invoiceAmount } = parsed.data

    const voucher = await repo.findActiveVoucher(code)

    if (!voucher) {
      ok(res, { valid: false, message: 'Kode voucher tidak ditemukan atau tidak aktif' })
      return
    }

    // Cek validity period
    const now = new Date()
    if (now < new Date(voucher.valid_from)) {
      ok(res, { valid: false, message: 'Voucher belum berlaku' })
      return
    }
    if (now > new Date(voucher.valid_until)) {
      ok(res, { valid: false, message: 'Voucher sudah kadaluarsa' })
      return
    }

    // Cek usage limit
    if (voucher.usage_limit !== null && voucher.usage_count >= voucher.usage_limit) {
      ok(res, { valid: false, message: 'Kuota voucher sudah habis' })
      return
    }

    // Cek minimum purchase
    if (invoiceAmount < voucher.min_purchase) {
      ok(res, {
        valid: false,
        message: `Minimum pembelian untuk voucher ini adalah Rp ${voucher.min_purchase.toLocaleString('id-ID')}`,
      })
      return
    }

    // Hitung discount
    let discountAmount: number
    if (voucher.type === 'percentage') {
      discountAmount = (voucher.value / 100) * invoiceAmount
      if (voucher.max_discount !== null) {
        discountAmount = Math.min(discountAmount, voucher.max_discount)
      }
    } else {
      // fixed
      discountAmount = Math.min(voucher.value, invoiceAmount)
    }

    discountAmount = Math.round(discountAmount * 100) / 100
    const finalAmount = Math.max(0, invoiceAmount - discountAmount)

    ok(res, {
      valid: true,
      voucherId: voucher.id,
      code: voucher.code,
      type: voucher.type,
      discountAmount,
      finalAmount,
      message: `Voucher berhasil diterapkan. Diskon Rp ${discountAmount.toLocaleString('id-ID')}`,
    })
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}
