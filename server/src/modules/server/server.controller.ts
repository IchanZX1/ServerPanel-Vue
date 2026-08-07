import type { Request, Response } from 'express'
import * as service from './server.service.js'
import { ok, fail, forbidden } from '../../utils/responseBuilder.js'
import { z } from 'zod'

const renewSchema = z.object({
  serverId: z.string().uuid(),
  extendMonths: z.number().int().refine((v) => [1, 3, 6, 12].includes(v), {
    message: 'extendMonths harus 1, 3, 6, atau 12',
  }),
})

const planChangeSchema = z.object({
  serverId: z.string().uuid(),
  toProductId: z.string().uuid(),
})

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.listServerPage(req.user!.sub)
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}

export async function detail(req: Request, res: Response): Promise<void> {
  try {
    const { serverId } = req.body as { serverId?: string }
    if (!serverId) {
      fail(res, 'serverId diperlukan', 422)
      return
    }

    const result = await service.getServerDetail(serverId, req.user!.sub)
    if (!result) {
      // 403 bukan 404 — sembunyikan eksistensi server milik orang lain
      forbidden(res)
      return
    }
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}

export async function renew(req: Request, res: Response): Promise<void> {
  try {
    const parsed = renewSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, parsed.error.errors[0]?.message ?? 'Input tidak valid', 422)
      return
    }

    const result = await service.requestRenewal({
      serverId: parsed.data.serverId,
      userId: req.user!.sub,
      extendMonths: parsed.data.extendMonths,
    })
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message)
  }
}

export async function downgrade(req: Request, res: Response): Promise<void> {
  try {
    const parsed = planChangeSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, parsed.error.errors[0]?.message ?? 'Input tidak valid', 422)
      return
    }

    const result = await service.requestDowngrade({
      serverId: parsed.data.serverId,
      userId: req.user!.sub,
      toProductId: parsed.data.toProductId,
    })
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message)
  }
}

export async function upgrade(req: Request, res: Response): Promise<void> {
  try {
    const parsed = planChangeSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, parsed.error.errors[0]?.message ?? 'Input tidak valid', 422)
      return
    }

    const result = await service.requestUpgrade({
      serverId: parsed.data.serverId,
      userId: req.user!.sub,
      toProductId: parsed.data.toProductId,
    })
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message)
  }
}
