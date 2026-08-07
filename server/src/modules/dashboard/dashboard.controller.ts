import type { Request, Response } from 'express'
import { db } from '../../config/db.js'
import * as repo from './dashboard.repository.js'
import { ok, fail } from '../../utils/responseBuilder.js'
import type { RowDataPacket } from 'mysql2'
import type { ServerRow } from '../../types/index.js'

function getStatusClass(status: string): string {
  switch (status) {
    case 'active': return 'server-card status-active'
    case 'suspended': return 'server-card status-suspended'
    case 'pending': return 'server-card status-pending'
    default: return 'server-card'
  }
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function getGraceDeadline(suspendedAt: string | null): string | null {
  if (!suspendedAt) return null
  const grace = new Date(suspendedAt)
  grace.setDate(grace.getDate() + 15)
  return grace.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub

    // Ambil data user
    const [userRows] = await db.execute<RowDataPacket[]>(
      'SELECT name, email, avatar_initial, created_at FROM users WHERE id = ? LIMIT 1',
      [userId],
    )
    const user = userRows[0] as {
      name: string; email: string; avatar_initial: string; created_at: string
    } | undefined

    if (!user) {
      fail(res, 'User tidak ditemukan', 404)
      return
    }

    // Paralel: stats + servers
    const [stats, servers] = await Promise.all([
      repo.getDashboardStats(userId),
      repo.getUserServers(userId),
    ])

    const mappedServers = servers.map((s: ServerRow) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      statusClass: getStatusClass(s.status),
      nodeVersion: s.node_version,
      storageType: s.storage_type,
      activeUntil: formatDate(s.active_until),
      ...(s.status === 'suspended' && s.suspended_at
        ? {
            suspendedAt: formatDate(s.suspended_at),
            graceDeadline: getGraceDeadline(s.suspended_at),
          }
        : {}),
    }))

    ok(res, {
      user: {
        name: user.name,
        email: user.email,
        avatarInitial: user.avatar_initial,
      },
      stats: {
        activeServers: stats.activeServers,
        suspendedServers: stats.suspendedServers,
        totalTransactions: stats.totalTransactions,
        joinedSince: formatDate(user.created_at),
      },
      servers: mappedServers,
    })
  } catch (err) {
    fail(res, (err as Error).message, 500)
  }
}
