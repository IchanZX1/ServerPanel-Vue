import { v4 as uuid } from 'uuid'
import * as repo from './server.repository.js'
import { env } from '../../config/env.js'
import type { ServerRow } from '../../types/index.js'

function getStatusClass(status: string): string {
  switch (status) {
    case 'active': return 'server-card status-active'
    case 'suspended': return 'server-card status-suspended'
    case 'pending': return 'server-card status-pending'
    default: return 'server-card'
  }
}

function getGraceDeadline(suspendedAt: string | null): string | null {
  if (!suspendedAt) return null
  const grace = new Date(suspendedAt)
  grace.setDate(grace.getDate() + 15)
  return grace.toISOString()
}

export async function listServerPage(userId: string) {
  const [products, servers] = await Promise.all([
    repo.getAllProducts(),
    repo.getUserServers(userId),
  ])

  const mappedServers = servers.map((s: ServerRow & { product_name?: string; product_price?: number; last_unit_price?: number }) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    statusClass: getStatusClass(s.status),
    productName: s.product_name ?? null,
    nodeVersion: s.node_version,
    storageType: s.storage_type,
    activeUntil: s.active_until,
    panelUrl: env.PTERO_BASE_URL,
    panelUsername: s.panel_username,
    productPrice: s.product_price ?? s.last_unit_price ?? null,
    ...(s.status === 'suspended' && s.suspended_at
      ? { suspendedAt: s.suspended_at, graceDeadline: getGraceDeadline(s.suspended_at) }
      : {}),
  }))

  return {
    productsEmpty: products.length === 0,
    productsEmptyMessage:
      products.length === 0
        ? 'Produk server belum tersedia. Silakan hubungi admin.'
        : undefined,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      badge: p.badge,
      price: p.price,
      billingPeriod: p.billing_period,
      cpuAlloc: p.cpu_alloc,
      ramAlloc: p.ram_alloc,
      storageAlloc: p.storage_alloc,
      bandwidthAlloc: p.bandwidth_alloc,
      nodeVersion: p.node_version,
      storageType: p.storage_type,
    })),
    servers: mappedServers,
  }
}

export async function getServerDetail(serverId: string, userId: string) {
  const server = await repo.getServerById(serverId, userId)
  if (!server) return null

  const specs = await repo.getServerSpecs(serverId)

  return {
    id: server.id,
    name: server.name,
    status: server.status,
    statusClass: getStatusClass(server.status),
    ipAddress: server.ip_address,
    panelUrl: env.PTERO_BASE_URL,
    panelUsername: server.panel_username,
    nodeVersion: server.node_version,
    storageType: server.storage_type,
    activeUntil: server.active_until,
    ...(server.status === 'suspended' && server.suspended_at
      ? { suspendedAt: server.suspended_at, graceDeadline: getGraceDeadline(server.suspended_at) }
      : {}),
    specs: specs ?? null,
  }
}

export async function requestRenewal(data: {
  serverId: string
  userId: string
  extendMonths: number
}) {
  const server = await repo.getServerById(data.serverId, data.userId)
  if (!server) throw new Error('Server tidak ditemukan')

  // Validasi status
  if (server.status === 'pending') throw new Error('Server sedang dalam proses provisioning')
  if (server.status === 'terminated') throw new Error('Server tidak ditemukan')

  // Grace period check untuk suspended
  if (server.status === 'suspended') {
    if (!server.suspended_at) throw new Error('Server tidak bisa diperpanjang')
    const graceDeadline = new Date(server.suspended_at)
    graceDeadline.setDate(graceDeadline.getDate() + 15)
    if (new Date() > graceDeadline) {
      throw new Error('Server sudah melewati grace period 15 hari, tidak bisa diperpanjang')
    }
  }

  // Cek tidak ada renewal pending — tapi izinkan override jika renewal lama
  // sudah tidak bisa dibayar (invoice tidak pending / payment expired / belum ada payment)
  const pendingRenewal = await repo.findPendingRenewal(data.serverId)
  if (pendingRenewal) {
    const stale =
      pendingRenewal.invoice_status !== 'pending' || pendingRenewal.payment_status !== 'pending'
    if (!stale) {
      throw new Error('Sudah ada permintaan renewal yang sedang menunggu pembayaran')
    }
    await repo.expireRenewal(pendingRenewal.renewal_id)
  }

  // Harga produk — fallback ke harga invoice terakhir jika produk dihapus/dinonaktifkan
  let priceSnapshot: number | null = server.product_id
    ? (await repo.getProductByIdAny(server.product_id))?.price ?? null
    : null
  if (priceSnapshot === null) {
    priceSnapshot = await repo.getLastServerUnitPrice(data.serverId)
  }
  if (priceSnapshot === null) throw new Error('Produk server tidak ditemukan')

  const totalPrice = data.extendMonths * priceSnapshot

  // Hitung new_active_until — GREATEST(active_until, CURDATE())
  const baseDate = server.active_until
    ? new Date(Math.max(new Date(server.active_until).getTime(), Date.now()))
    : new Date()
  const newActiveUntil = new Date(baseDate)
  newActiveUntil.setMonth(newActiveUntil.getMonth() + data.extendMonths)

  // Buat invoice
  const invoiceId = uuid()
  const invoiceNumber = await repo.getNextInvoiceNumber()
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 hari

  await repo.createInvoice({
    id: invoiceId,
    userId: data.userId,
    invoiceNumber,
    subtotal: totalPrice,
    total: totalPrice,
    dueDate,
  })

  await repo.createInvoiceItem({
    id: uuid(),
    invoiceId,
    productId: server.product_id ?? null,
    serverId: data.serverId,
    description: `Perpanjangan server "${server.name}" — ${data.extendMonths} bulan`,
    quantity: data.extendMonths,
    unitPrice: priceSnapshot,
    total: totalPrice,
  })

  const renewalId = uuid()
  await repo.createRenewalRequest({
    id: renewalId,
    userId: data.userId,
    serverId: data.serverId,
    invoiceId,
    extendMonths: data.extendMonths,
    priceSnapshot,
    totalPrice,
    newActiveUntil,
  })

  return {
    renewalRequestId: renewalId,
    invoiceId,
    invoiceNumber,
    extendMonths: data.extendMonths,
    totalPrice,
    currentActiveUntil: server.active_until,
    newActiveUntil: newActiveUntil.toISOString().split('T')[0],
    status: 'pending',
    message: 'Invoice perpanjangan telah dibuat. Masa aktif akan diperbarui setelah pembayaran dikonfirmasi.',
  }
}

export async function requestDowngrade(data: {
  serverId: string
  userId: string
  toProductId: string
}) {
  const server = await repo.getServerById(data.serverId, data.userId)
  if (!server) throw new Error('Server tidak ditemukan')
  if (!server.product_id) throw new Error('Server tidak memiliki produk aktif')
  if (server.status !== 'active') throw new Error('Server harus aktif untuk melakukan downgrade')

  const [fromProduct, toProduct] = await Promise.all([
    repo.getProductById(server.product_id),
    repo.getProductById(data.toProductId),
  ])
  if (!fromProduct) throw new Error('Produk saat ini tidak ditemukan')
  if (!toProduct) throw new Error('Produk tujuan tidak ditemukan')
  if (toProduct.price >= fromProduct.price) throw new Error('Produk tujuan harus lebih murah dari produk saat ini')

  if (await repo.hasPendingPlanChange(data.serverId)) {
    throw new Error('Sudah ada perubahan paket yang sedang menunggu')
  }

  const effectiveDate = server.active_until ? new Date(server.active_until) : new Date()

  const planChangeId = uuid()
  await repo.createPlanChangeRequest({
    id: planChangeId,
    serverId: data.serverId,
    changeType: 'downgrade',
    fromProductId: fromProduct.id,
    toProductId: toProduct.id,
    prorataAmount: 0,
    invoiceId: null,
    effectiveDate,
    status: 'scheduled',
  })

  return {
    planChangeId,
    changeType: 'downgrade',
    fromProduct: { id: fromProduct.id, name: fromProduct.name, price: fromProduct.price },
    toProduct: { id: toProduct.id, name: toProduct.name, price: toProduct.price },
    effectiveDate: effectiveDate.toISOString().split('T')[0],
    cost: 0,
    status: 'scheduled',
    message: `Downgrade dijadwalkan. Paket akan berubah pada ${effectiveDate.toISOString().split('T')[0]}. Tidak ada biaya.`,
  }
}

export async function requestUpgrade(data: {
  serverId: string
  userId: string
  toProductId: string
}) {
  const server = await repo.getServerById(data.serverId, data.userId)
  if (!server) throw new Error('Server tidak ditemukan')
  if (!server.product_id) throw new Error('Server tidak memiliki produk aktif')
  if (server.status !== 'active') throw new Error('Server harus aktif untuk melakukan upgrade')

  const [fromProduct, toProduct] = await Promise.all([
    repo.getProductById(server.product_id),
    repo.getProductById(data.toProductId),
  ])
  if (!fromProduct) throw new Error('Produk saat ini tidak ditemukan')
  if (!toProduct) throw new Error('Produk tujuan tidak ditemukan')
  if (toProduct.price <= fromProduct.price) throw new Error('Produk tujuan harus lebih mahal dari produk saat ini')

  if (await repo.hasPendingPlanChange(data.serverId)) {
    throw new Error('Sudah ada perubahan paket yang sedang menunggu')
  }

  // Kalkulasi prorata
  const activeUntil = server.active_until ? new Date(server.active_until) : new Date()
  const remainingDays = Math.max(
    0,
    Math.ceil((activeUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )
  const priceDiff = toProduct.price - fromProduct.price
  const prorataAmount = Math.round((priceDiff / 30) * remainingDays * 100) / 100

  // Buat invoice
  const invoiceId = uuid()
  const invoiceNumber = await repo.getNextInvoiceNumber()
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await repo.createInvoice({
    id: invoiceId,
    userId: data.userId,
    invoiceNumber,
    subtotal: prorataAmount,
    total: prorataAmount,
    dueDate,
  })

  await repo.createInvoiceItem({
    id: uuid(),
    invoiceId,
    productId: toProduct.id,
    serverId: data.serverId,
    description: `Upgrade server "${server.name}" dari ${fromProduct.name} ke ${toProduct.name} (prorata ${remainingDays} hari)`,
    quantity: 1,
    unitPrice: prorataAmount,
    total: prorataAmount,
  })

  const planChangeId = uuid()
  await repo.createPlanChangeRequest({
    id: planChangeId,
    serverId: data.serverId,
    changeType: 'upgrade',
    fromProductId: fromProduct.id,
    toProductId: toProduct.id,
    prorataAmount,
    invoiceId,
    effectiveDate: new Date(),
    status: 'pending',
  })

  return {
    planChangeId,
    invoiceId,
    invoiceNumber,
    changeType: 'upgrade',
    fromProduct: { id: fromProduct.id, name: fromProduct.name, price: fromProduct.price },
    toProduct: { id: toProduct.id, name: toProduct.name, price: toProduct.price },
    calculation: { remainingDays, priceDiff, prorataAmount },
    status: 'pending',
    message: 'Invoice upgrade telah dibuat. Paket akan diupgrade segera setelah pembayaran dikonfirmasi.',
  }
}
