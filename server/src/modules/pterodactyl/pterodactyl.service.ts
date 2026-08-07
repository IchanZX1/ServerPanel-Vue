import { env } from '../../config/env.js'
import { logger } from '../../utils/logger.js'
import type { PteroUser, PteroServer } from './pterodactyl.types.js'

const BASE = env.PTERO_BASE_URL
const HEADERS = {
  'Authorization': `Bearer ${env.PTERO_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

async function pteroFetch(path: string, options?: RequestInit) {
  const url = `${BASE}${path}`
  const res = await fetch(url, { ...options, headers: { ...HEADERS, ...options?.headers } })
  return res
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Sesuaikan username dengan rule Pterodactyl (p_username):
 * harus dimulai & diakhiri alphanumeric, hanya huruf/angka/dash/underscore/titik.
 */
export function sanitizePteroUsername(raw: string): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9._-]+/g, '')
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
  if (!cleaned) return `user${Date.now().toString(36)}`
  return cleaned.slice(0, 32)
}

/**
 * Sanitasi nama depan/belakang sesuai rule Pterodactyl (p_name):
 * hanya huruf, angka, spasi, dash, underscore, titik, apostrophe.
 */
export function sanitizePteroName(raw: string, fallback: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9\s\-_.']+/g, '').trim()
  if (!cleaned) return sanitizePteroUsername(fallback)
  return cleaned.slice(0, 191)
}

export async function createPterodactylUser(data: {
  email: string
  username: string
  firstName: string
  lastName: string
  password: string
}): Promise<PteroUser> {
  const res = await pteroFetch('/api/application/users', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      username: data.username,
      first_name: data.firstName,
      last_name: data.lastName,
      password: data.password,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pterodactyl createUser failed: ${res.status} ${err}`)
  }
  const json = await res.json() as { attributes: PteroUser }
  return json.attributes
}

export async function updatePterodactylUserPassword(
  pteroUserId: number,
  newPassword: string,
): Promise<void> {
  const res = await pteroFetch(`/api/application/users/${pteroUserId}`, {
    method: 'PATCH',
    body: JSON.stringify({ password: newPassword }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pterodactyl updateUser failed: ${res.status} ${err}`)
  }
}

// ─── Servers ─────────────────────────────────────────────────────────────────

export async function getAvailableAllocation(nodeId: number): Promise<{
  id: number
  ip: string
  port: number
}> {
  const res = await pteroFetch(
    `/api/application/nodes/${nodeId}/allocations?per_page=100&page=1`,
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pterodactyl getAllocations failed: ${res.status} ${err}`)
  }
  const json = await res.json() as {
    data: Array<{ attributes: { id: number; ip: string; port: number; assigned: boolean } }>
  }
  const free = json.data.find((a) => !a.attributes.assigned)
  if (!free) {
    throw new Error('Tidak ada allocation tersedia di node ini')
  }
  return { id: free.attributes.id, ip: free.attributes.ip, port: free.attributes.port }
}

export async function createPterodactylServer(data: {
  name: string
  pteroUserId: number
  memory: number
  disk: number
  cpu: number
  allocationId: number
}): Promise<PteroServer> {
  let startup_cmd = 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi;  if [[ ! -z ${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then      vars=$(echo ${CUSTOM_ENVIRONMENT_VARIABLES} | tr ";" "\n");      for line in $vars;     do export $line;     done fi;  /usr/local/bin/' + "${CMD_RUN}"
  const res = await pteroFetch('/api/application/servers', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      user: data.pteroUserId,
      description: "DIBUAT OLEH ICHANZX DEV PROTECTED",
      egg: parseInt(env.PTERO_EGG_ID, 10),
      docker_image: env.PTERO_DOCKER_IMAGE,
      startup: startup_cmd,
      environment: {
        INST: "npm",
        USER_UPLOAD: '0',
        AUTO_UPDATE: '0',
        CMD_RUN: 'npm start',
      },
      limits: {
        memory: data.memory,
        swap: 0,
        disk: data.disk,
        io: 500,
        cpu: data.cpu,
        threads: null,
      },
      feature_limits: { databases: 5, allocations: 1, backups: 5 },
      allocation: { default: data.allocationId },
      deploy: {
        locations: [parseInt(env.PTERO_LOCATION_ID)],
        dedicated_ip: false,
        port_range: [],
      },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pterodactyl createServer failed: ${res.status} ${err}`)
  }
  const json = await res.json() as { attributes: PteroServer }
  return json.attributes
}

export async function getPterodactylServer(pteroServerId: number): Promise<PteroServer> {
  const res = await pteroFetch(`/api/application/servers/${pteroServerId}`)
  if (!res.ok) {
    throw new Error(`Pterodactyl getServer failed: ${res.status}`)
  }
  const json = await res.json() as { attributes: PteroServer }
  return json.attributes
}

export async function updatePterodactylServerBuild(data: {
  pteroServerId: number
  allocationId: number
  memory: number
  disk: number
  cpu: number
}): Promise<void> {
  const res = await pteroFetch(`/api/application/servers/${data.pteroServerId}/build`, {
    method: 'PATCH',
    body: JSON.stringify({
      allocation: data.allocationId,
      oom_disabled: true,
      limits: {
        memory: data.memory,
        swap: 0,
        disk: data.disk,
        io: 500,
        cpu: data.cpu,
        threads: null,
      },
      feature_limits: { databases: 5, allocations: 1, backups: 5 },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pterodactyl updateBuild failed: ${res.status} ${err}`)
  }
}

export async function suspendPterodactylServer(pteroServerId: number): Promise<void> {
  const res = await pteroFetch(`/api/application/servers/${pteroServerId}/suspend`, {
    method: 'POST',
  })
  if (!res.ok && res.status !== 204) {
    throw new Error(`Pterodactyl suspend failed: ${res.status}`)
  }
}

export async function unsuspendPterodactylServer(pteroServerId: number): Promise<void> {
  const res = await pteroFetch(`/api/application/servers/${pteroServerId}/unsuspend`, {
    method: 'POST',
  })
  if (!res.ok && res.status !== 204) {
    throw new Error(`Pterodactyl unsuspend failed: ${res.status}`)
  }
}

export async function deletePterodactylServer(pteroServerId: number): Promise<void> {
  const res = await pteroFetch(`/api/application/servers/${pteroServerId}`, {
    method: 'DELETE',
  })
  // 404 = server sudah tidak ada, lanjut saja
  if (!res.ok && res.status !== 204 && res.status !== 404) {
    throw new Error(`Pterodactyl deleteServer failed: ${res.status}`)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse string resource ke integer MB
 * "2 GB" → 2048, "512 MB" → 512, "0" → 0 (unlimited)
 */
export function parseMB(value: string): number {
  if (value === '0' || value.toLowerCase().includes('unlimited')) return 0
  const match = value.match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i)
  if (!match) return 0
  const num = parseFloat(match[1]!)
  const unit = match[2]!.toUpperCase()
  return unit === 'GB' ? Math.round(num * 1024) : Math.round(num)
}

/**
 * Parse CPU string ke integer percent
 * "60% CPU Allocation" → 60, "100% CPU" → 100
 */
export function parseCPU(value: string): number {
  if (value === '0' || value.toLowerCase().includes('unlimited')) return 0
  const match = value.match(/(\d+)/)
  return match ? parseInt(match[1]!, 10) : 0
}

/**
 * Ambil allocation ID dari server Pterodactyl — fetch jika belum tersimpan di DB
 */
export async function ensureAllocationId(
  pteroServerId: number,
  storedAllocationId: number | null,
): Promise<number> {
  if (storedAllocationId) return storedAllocationId
  logger.info(`[pterodactyl] fetching allocation for server ${pteroServerId}`)
  const server = await getPterodactylServer(pteroServerId)
  return server.allocation
}
