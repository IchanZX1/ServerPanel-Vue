import type { Request, Response } from 'express'
import { db } from '../../config/db.js'
import { v4 as uuid } from 'uuid'
import { ok, fail } from '../../utils/responseBuilder.js'
import type { RowDataPacket } from 'mysql2'
import { z } from 'zod'

const contactSchema = z.object({
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
  category: z.enum(['general', 'technical', 'billing', 'abuse']).default('general'),
})

function generateTicketNumber(): string {
  return `TKT-${Date.now().toString(36).toUpperCase()}`
}

export async function send(req: Request, res: Response): Promise<void> {
  try {
    const parsed = contactSchema.safeParse(req.body)
    if (!parsed.success) {
      fail(res, parsed.error.errors[0]?.message ?? 'Input tidak valid', 422)
      return
    }

    const ticketId = uuid()
    const ticketNumber = generateTicketNumber()

    await db.execute(
      `INSERT INTO contact_tickets
       (id, user_id, ticket_number, subject, message, category, status, priority)
       VALUES (?, ?, ?, ?, ?, ?, 'open', 'medium')`,
      [ticketId, req.user!.sub, ticketNumber, parsed.data.subject, parsed.data.message, parsed.data.category],
    )

    ok(res, {
      ticketId,
      ticketNumber,
      message: 'Tiket berhasil dibuat. Admin akan merespons segera.',
    })
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, ticket_number, subject, category, status, priority, created_at, updated_at
       FROM contact_tickets WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [req.user!.sub],
    )
    ok(res, { tickets: rows })
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}

export async function detail(req: Request, res: Response): Promise<void> {
  try {
    const { ticketId } = req.body as { ticketId?: string }
    if (!ticketId) {
      fail(res, 'ticketId diperlukan', 422)
      return
    }

    const [ticketRows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM contact_tickets WHERE id = ? AND user_id = ? LIMIT 1`,
      [ticketId, req.user!.sub],
    )
    if (!ticketRows[0]) {
      fail(res, 'Tiket tidak ditemukan', 404)
      return
    }

    const [replyRows] = await db.execute<RowDataPacket[]>(
      `SELECT tr.id, tr.message, tr.is_admin_reply, tr.created_at,
              u.name as sender_name
       FROM ticket_replies tr
       JOIN users u ON u.id = tr.user_id
       WHERE tr.ticket_id = ? ORDER BY tr.created_at ASC`,
      [ticketId],
    )

    ok(res, { ticket: ticketRows[0], replies: replyRows })
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}

export async function reply(req: Request, res: Response): Promise<void> {
  try {
    const { ticketId, message } = req.body as { ticketId?: string; message?: string }
    if (!ticketId || !message?.trim()) {
      fail(res, 'ticketId dan message diperlukan', 422)
      return
    }

    // Pastikan tiket milik user ini
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, status FROM contact_tickets WHERE id = ? AND user_id = ? LIMIT 1`,
      [ticketId, req.user!.sub],
    )
    if (!rows[0]) {
      fail(res, 'Tiket tidak ditemukan', 404)
      return
    }

    const replyId = uuid()
    await db.execute(
      `INSERT INTO ticket_replies (id, ticket_id, user_id, message, is_admin_reply)
       VALUES (?, ?, ?, ?, 0)`,
      [replyId, ticketId, req.user!.sub, message.trim()],
    )

    // Reopen tiket jika sudah resolved
    await db.execute(
      `UPDATE contact_tickets SET status = 'open', updated_at = NOW()
       WHERE id = ? AND status IN ('resolved', 'closed')`,
      [ticketId],
    )

    ok(res, { replyId, message: 'Balasan berhasil dikirim' })
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}
