// Pterodactyl Application API types

export interface PteroUser {
  id: number
  external_id: string | null
  uuid: string
  username: string
  email: string
  first_name: string
  last_name: string
  language: string
  root_admin: boolean
  '2fa': boolean
  created_at: string
  updated_at: string
}

export interface PteroServer {
  id: number
  external_id: string | null
  uuid: string
  identifier: string
  name: string
  description: string
  suspended: boolean
  limits: {
    memory: number
    swap: number
    disk: number
    io: number
    cpu: number
    threads: string | null
  }
  feature_limits: {
    databases: number
    allocations: number
    backups: number
  }
  user: number
  node: number
  allocation: number
  nest: number
  egg: number
  created_at: string
  updated_at: string
}

export interface PteroLimits {
  memory: number
  swap: number
  disk: number
  io: number
  cpu: number
  threads: string | null
}

export interface CreateServerPayload {
  name: string
  user: number
  egg: number
  docker_image: string
  startup: string
  environment: Record<string, string>
  limits: PteroLimits
  feature_limits: { databases: number; allocations: number; backups: number }
  allocation: { default: number }
}
