import type { Request, Response } from 'express'
import * as repo from './invoice.repository.js'
import { ok, fail, forbidden } from '../../utils/responseBuilder.js'

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as { page?: string; limit?: string }
    const page = parseInt(body.page ?? '1', 10) || 1
    const limit = Math.min(parseInt(body.limit ?? '10', 10) || 10, 50)
    const result = await repo.getUserInvoices(req.user!.sub, page, limit)
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}

export async function detail(req: Request, res: Response): Promise<void> {
  try {
    const { invoiceId } = (req.body ?? {}) as { invoiceId?: string }
    if (!invoiceId) {
      fail(res, 'invoiceId diperlukan', 422)
      return
    }
    const result = await repo.getInvoiceDetail(invoiceId, req.user!.sub)
    if (!result) {
      forbidden(res)
      return
    }
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}
