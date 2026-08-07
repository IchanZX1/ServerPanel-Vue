import type { Request, Response, NextFunction } from 'express'
import * as repo from './admin.repository.js'
import { suspendPterodactylServer, unsuspendPterodactylServer, deletePterodactylServer } from '../pterodactyl/pterodactyl.service.js'
import { sendMail, mailServerSuspendedByAdmin } from '../../utils/mailer.js'
import { logger } from '../../utils/logger.js'
import { db } from '../../config/db.js'
import type { RowDataPacket } from 'mysql2'

const SESSION_COOKIE = 'admin_sid'

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function requireAdminSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined
  if (!sessionId) {
    res.redirect('/admin/login')
    return
  }
  const session = await repo.getAdminSession(sessionId)
  if (!session) {
    res.clearCookie(SESSION_COOKIE)
    res.redirect('/admin/login')
    return
  }
  // Attach admin info ke res.locals
  res.locals.adminId = session.adminId
  res.locals.adminEmail = session.adminEmail
  next()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getLogin(_req: Request, res: Response): Promise<void> {
  res.json({ page: 'admin_login', message: 'Admin login page' })
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email dan password diperlukan' })
      return
    }

    const admin = await repo.findAdminByEmail(email)
    if (!admin) {
      res.status(401).json({ success: false, message: 'Kredensial tidak valid' })
      return
    }

    const { comparePassword } = await import('../../utils/password.js')
    const valid = await comparePassword(password, admin.password_hash)
    if (!valid) {
      res.status(401).json({ success: false, message: 'Kredensial tidak valid' })
      return
    }

    const sessionId = await repo.createAdminSession(admin.id, admin.email)
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 jam
    })

    res.json({ success: true, message: 'Login berhasil', redirect: '/admin/dashboard' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function getLogout(req: Request, res: Response): Promise<void> {
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined
  if (sessionId) await repo.destroyAdminSession(sessionId)
  res.clearCookie(SESSION_COOKIE)
  res.json({ success: true, message: 'Logout berhasil' })
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await repo.getAdminStats()
    res.json({ success: true, data: stats })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt((req.query['page'] as string) ?? '1', 10) || 1
    const limit = parseInt((req.query['limit'] as string) ?? '20', 10) || 20
    const search = (req.query['search'] as string) || undefined
    const result = await repo.getAllUsers(page, limit, search)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function getUserDetail(req: Request, res: Response): Promise<void> {
  try {
    const result = await repo.getUserDetail(req.params['id'] as string)
    if (!result) { res.status(404).json({ success: false, message: 'User tidak ditemukan' }); return }
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    await repo.softDeleteUser(req.params['id'] as string)
    res.json({ success: true, message: 'User berhasil dihapus' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

// ─── Servers ──────────────────────────────────────────────────────────────────

export async function getServers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt((req.query['page'] as string) ?? '1', 10) || 1
    const limit = parseInt((req.query['limit'] as string) ?? '20', 10) || 20
    const search = (req.query['search'] as string) || undefined
    const result = await repo.getAllServers(page, limit, search)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function suspendServer(req: Request, res: Response): Promise<void> {
  try {
    const serverId = req.params['id'] as string
    const reason = (req.body as { reason?: string }).reason ?? null

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT s.*, u.email, u.name as user_name
       FROM servers s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.deleted_at IS NULL LIMIT 1`,
      [serverId],
    )
    const server = rows[0] as {
      id: string; pterodactyl_server_id: number | null; status: string
      name: string; email: string; user_name: string
    } | undefined

    if (!server) { res.status(404).json({ success: false, message: 'Server tidak ditemukan' }); return }
    if (server.status === 'suspended') { res.status(400).json({ success: false, message: 'Server sudah suspended' }); return }
    if (server.status === 'terminated') { res.status(400).json({ success: false, message: 'Server sudah terminated' }); return }

    if (server.pterodactyl_server_id) {
      await suspendPterodactylServer(server.pterodactyl_server_id)
    }

    await db.execute(
      `UPDATE servers SET status = 'suspended', suspended_at = NOW(),
       suspend_reason = ?, updated_at = NOW() WHERE id = ?`,
      [reason, serverId],
    )

    sendMail({
      to: server.email,
      subject: `Server ${server.name} telah disuspend`,
      html: mailServerSuspendedByAdmin(server.user_name, server.name, reason),
    })

    logger.info(`[admin] server ${serverId} suspended by admin ${res.locals.adminId}`)
    res.json({ success: true, message: 'Server berhasil disuspend' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function unsuspendServer(req: Request, res: Response): Promise<void> {
  try {
    const serverId = req.params['id'] as string
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, pterodactyl_server_id, status FROM servers WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [serverId],
    )
    const server = rows[0] as { id: string; pterodactyl_server_id: number | null; status: string } | undefined

    if (!server) { res.status(404).json({ success: false, message: 'Server tidak ditemukan' }); return }
    if (server.status !== 'suspended') { res.status(400).json({ success: false, message: 'Server tidak dalam status suspended' }); return }

    if (server.pterodactyl_server_id) {
      await unsuspendPterodactylServer(server.pterodactyl_server_id)
    }

    await db.execute(
      `UPDATE servers SET status = 'active', suspended_at = NULL,
       suspend_reason = NULL, updated_at = NOW() WHERE id = ?`,
      [serverId],
    )

    logger.info(`[admin] server ${serverId} unsuspended by admin ${res.locals.adminId}`)
    res.json({ success: true, message: 'Server berhasil diaktifkan kembali' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function deleteServer(req: Request, res: Response): Promise<void> {
  try {
    const serverId = req.params['id'] as string
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT id, pterodactyl_server_id FROM servers WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [serverId],
    )
    const server = rows[0] as { id: string; pterodactyl_server_id: number | null } | undefined
    if (!server) { res.status(404).json({ success: false, message: 'Server tidak ditemukan' }); return }

    if (server.pterodactyl_server_id) {
      await deletePterodactylServer(server.pterodactyl_server_id)
    }

    await db.execute(
      `UPDATE servers SET status = 'terminated', deleted_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [serverId],
    )
    await db.execute(
      `UPDATE server_renewal_requests SET status = 'cancelled' WHERE server_id = ? AND status = 'pending'`,
      [serverId],
    )
    await db.execute(
      `UPDATE server_plan_change_requests SET status = 'cancelled' WHERE server_id = ? AND status IN ('pending','scheduled')`,
      [serverId],
    )

    logger.info(`[admin] server ${serverId} deleted by admin ${res.locals.adminId}`)
    res.json({ success: true, message: 'Server berhasil dihapus' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function getInvoices(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt((req.query['page'] as string) ?? '1', 10) || 1
    const limit = parseInt((req.query['limit'] as string) ?? '20', 10) || 20
    const result = await repo.getAllInvoices(page, limit)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function confirmInvoice(req: Request, res: Response): Promise<void> {
  try {
    await repo.confirmInvoicePaid(req.params['id'] as string)
    res.json({ success: true, message: 'Invoice berhasil dikonfirmasi' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export async function getTickets(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt((req.query['page'] as string) ?? '1', 10) || 1
    const limit = parseInt((req.query['limit'] as string) ?? '20', 10) || 20
    const result = await repo.getAllTickets(page, limit)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function replyTicket(req: Request, res: Response): Promise<void> {
  try {
    const { message } = req.body as { message?: string }
    if (!message?.trim()) { res.status(400).json({ success: false, message: 'Pesan diperlukan' }); return }
    await repo.replyTicket(req.params['id'] as string, (res.locals['adminId'] as string) ?? (req.user?.sub ?? ''), message.trim())
    res.json({ success: true, message: 'Balasan berhasil dikirim' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(_req: Request, res: Response): Promise<void> {
  try {
    const products = await repo.getAllProductsAdmin()
    res.json({ success: true, data: products })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      name: string; badge?: string; price: number; billingPeriod?: string
      cpuAlloc: number; ramAlloc: number; storageAlloc: number; bandwidthAlloc: string
      nodeVersion?: string; storageType?: string; sortOrder?: number
    }
    if (!body.name || body.price == null) {
      res.status(400).json({ success: false, message: 'name dan price diperlukan' })
      return
    }
    await repo.createProduct({
      name: body.name, badge: body.badge ?? null, price: Number(body.price),
      billingPeriod: body.billingPeriod ?? 'monthly',
      cpuAlloc: Number(body.cpuAlloc) || 0,
      ramAlloc: Number(body.ramAlloc) || 0,
      storageAlloc: Number(body.storageAlloc) || 0,
      bandwidthAlloc: body.bandwidthAlloc ?? 'Unlimited',
      nodeVersion: body.nodeVersion ?? 'NodeJS 22',
      storageType: body.storageType ?? 'NVMe SSD',
      sortOrder: body.sortOrder ?? 0,
    })
    res.json({ success: true, message: 'Produk berhasil dibuat' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    await repo.updateProduct(req.params['id'] as string, req.body as Record<string, unknown>)
    res.json({ success: true, message: 'Produk berhasil diupdate' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params['id'] as string
    const refs = await repo.countProductReferences(id)
    if (refs > 0) {
      res.status(409).json({
        success: false,
        message: 'Produk masih digunakan oleh server / permintaan upgrade. Tidak dapat dihapus permanen. Gunakan tombol Nonaktifkan saja.',
      })
      return
    }
    await repo.hardDeleteProduct(id)
    res.json({ success: true, message: 'Produk berhasil dihapus permanen' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

// ─── Vouchers ─────────────────────────────────────────────────────────────────

export async function getVouchers(_req: Request, res: Response): Promise<void> {
  try {
    const vouchers = await repo.getAllVouchers()
    res.json({ success: true, data: vouchers })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function createVoucher(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      code: string; type: 'percentage' | 'fixed'; value: number
      minPurchase?: number; maxDiscount?: number; usageLimit?: number
      validFrom: string; validUntil: string
    }
    await repo.createVoucher({
      code: body.code, type: body.type, value: body.value,
      minPurchase: body.minPurchase ?? 0,
      maxDiscount: body.maxDiscount ?? null,
      usageLimit: body.usageLimit ?? null,
      validFrom: new Date(body.validFrom),
      validUntil: new Date(body.validUntil),
      adminId: res.locals.adminId as string,
    })
    res.json({ success: true, message: 'Voucher berhasil dibuat' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function toggleVoucher(req: Request, res: Response): Promise<void> {
  try {
    await repo.toggleVoucher(req.params['id'] as string)
    res.json({ success: true, message: 'Status voucher berhasil diubah' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function deleteVoucher(req: Request, res: Response): Promise<void> {
  try {
    const result = await repo.deleteVoucher(req.params['id'] as string)
    if (!result.deleted) {
      res.status(400).json({ success: false, message: result.reason })
      return
    }
    res.json({ success: true, message: 'Voucher berhasil dihapus' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string; newPassword?: string
    }
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Password lama dan baru diperlukan' })
      return
    }

    const adminEmail = (res.locals['adminEmail'] as string) ?? req.user?.email ?? ''
    const adminId    = (res.locals['adminId']    as string) ?? req.user?.sub  ?? ''

    const admin = await repo.findAdminByEmail(adminEmail)
    if (!admin) { res.status(404).json({ success: false, message: 'Admin tidak ditemukan' }); return }

    const { comparePassword } = await import('../../utils/password.js')
    const valid = await comparePassword(currentPassword, admin.password_hash)
    if (!valid) {
      res.status(400).json({ success: false, message: 'Password lama tidak benar' })
      return
    }

    await repo.updateAdminPassword(adminId, newPassword)
    res.json({ success: true, message: 'Password admin berhasil diubah' })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}
