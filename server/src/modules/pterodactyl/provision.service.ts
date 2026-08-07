import { v4 as uuid } from 'uuid'
import { db } from '../../config/db.js'
import { env } from '../../config/env.js'
import { encrypt } from '../../utils/crypto.js'
import { logger } from '../../utils/logger.js'
import type { RowDataPacket } from 'mysql2'
import {
  createPterodactylUser,
  createPterodactylServer,
  getAvailableAllocation,
  sanitizePteroUsername,
  sanitizePteroName,
  parseMB,
  parseCPU,
} from './pterodactyl.service.js'

export function generatePanelPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 16; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export async function provisionNewServer(data: {
  userId: string
  productId: string
  name: string
  months: number
}): Promise<{
  serverId: string
  name: string
  pterodactylServerId: number
  pterodactylIdentifier: string
  status: 'active'
  nodeVersion: string | null
  storageType: string | null
  ipAddress: string
  activeUntil: string
  specs: { cpu: number; ram: number; storage: number; bandwidth: string }
  credentials: { panelUrl: string; username: string; password: string }
}> {
  const [userRows] = await db.execute<RowDataPacket[]>(
    `SELECT id, name, username, email, pterodactyl_user_id
     FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [data.userId],
  )
  const user = userRows[0] as {
    id: string; name: string; username: string; email: string; pterodactyl_user_id: number | null
  } | undefined
  if (!user) throw new Error('User tidak ditemukan')

  const [productRows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM server_products WHERE id = ? AND is_available = 1 LIMIT 1`,
    [data.productId],
  )
  const product = productRows[0] as {
    id: string; name: string; price: number; cpu_alloc: number; ram_alloc: number
    storage_alloc: number; bandwidth_alloc: string; node_version: string | null; storage_type: string | null
  } | undefined
  if (!product) throw new Error('Produk tidak ditemukan')

  // 1) Ensure Pterodactyl user
  const pteroUsername = sanitizePteroUsername(user.username)
  let pteroUserId = user.pterodactyl_user_id
  if (!pteroUserId) {
    const nameParts = user.name.split(/\s+/)
    const pteroUser = await createPterodactylUser({
      email: user.email,
      username: pteroUsername,
      firstName: sanitizePteroName(nameParts[0] ?? '', user.username),
      lastName: sanitizePteroName(nameParts.slice(1).join(' ') || '-', user.username),
      password: generatePanelPassword(),
    })
    pteroUserId = pteroUser.id
    await db.execute(
      'UPDATE users SET pterodactyl_user_id = ?, updated_at = NOW() WHERE id = ?',
      [pteroUserId, user.id],
    )
  }

  // 2) Get free allocation & create Pterodactyl server
  const allocation = await getAvailableAllocation(parseInt(env.PTERO_NODE_ID, 10))
  const pteroServer = await createPterodactylServer({
    name: data.name,
    pteroUserId,
    memory: parseMB(String(product.ram_alloc)),
    disk: parseMB(String(product.storage_alloc)),
    cpu: parseCPU(String(product.cpu_alloc)),
    allocationId: allocation.id,
  })

  // 3) Persist ke DB
  const serverId = uuid()
  const panelPassword = generatePanelPassword()
  const activeUntil = new Date()
  activeUntil.setMonth(activeUntil.getMonth() + data.months)
  activeUntil.setHours(23, 59, 59, 999)

  await db.execute(
    `INSERT INTO servers
     (id, user_id, product_id, name, status, node_version, storage_type,
      ip_address, panel_username, panel_password_enc, active_until,
      pterodactyl_user_id, pterodactyl_server_id, pterodactyl_allocation_id)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      serverId, user.id, product.id, data.name,
      product.node_version, product.storage_type,
      `${allocation.ip}:${allocation.port}`,
      pteroUsername, encrypt(panelPassword), activeUntil,
      pteroUserId, pteroServer.id, allocation.id,
    ],
  )

  await db.execute(
    `INSERT INTO server_specs
     (id, server_id, cpu_alloc, ram_alloc, storage_alloc, bandwidth_alloc)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      uuid(), serverId,
      `${product.cpu_alloc}% CPU Allocation`,
      `${product.ram_alloc} MB RAM Allocation`,
      `${product.storage_alloc} MB Storage`,
      product.bandwidth_alloc,
    ],
  )

  logger.info(`[provision] server ${serverId} provisioned for user ${user.id}`)

  return {
    serverId,
    name: data.name,
    pterodactylServerId: pteroServer.id,
    pterodactylIdentifier: pteroServer.identifier,
    status: 'active',
    nodeVersion: product.node_version,
    storageType: product.storage_type,
    ipAddress: `${allocation.ip}:${allocation.port}`,
    activeUntil: activeUntil.toISOString().split('T')[0],
    specs: {
      cpu: product.cpu_alloc,
      ram: product.ram_alloc,
      storage: product.storage_alloc,
      bandwidth: product.bandwidth_alloc,
    },
    credentials: {
      panelUrl: env.PTERO_BASE_URL,
      username: pteroUsername,
      password: panelPassword,
    },
  }
}
