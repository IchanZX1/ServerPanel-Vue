// Shared domain types

export type ServerStatus = 'active' | 'suspended' | 'pending' | 'terminated'
export type InvoiceStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed'
export type ChangeType = 'upgrade' | 'downgrade'
export type VoucherType = 'percentage' | 'fixed'

export interface ServerRow {
  id: string
  user_id: string
  product_id: string | null
  name: string
  status: ServerStatus
  node_version: string | null
  storage_type: string | null
  ip_address: string | null
  panel_username: string | null
  panel_password_enc: string | null
  active_until: string | null
  suspended_at: string | null
  pterodactyl_user_id: number | null
  pterodactyl_server_id: number | null
  pterodactyl_allocation_id: number | null
  suspend_reason: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface UserRow {
  id: string
  name: string
  username: string
  email: string
  password_hash: string
  avatar_initial: string
  role: 'customer' | 'admin'
  is_active: number
  is_email_verified: number
  login_fail_count: number
  locked_until: string | null
  pterodactyl_user_id: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductRow {
  id: string
  name: string
  badge: string | null
  price: number
  billing_period: string
  cpu_alloc: string
  ram_alloc: string
  storage_alloc: string
  bandwidth_alloc: string
  node_version: string | null
  storage_type: string | null
  is_available: number
  sort_order: number
}

export interface InvoiceRow {
  id: string
  user_id: string
  invoice_number: string
  status: InvoiceStatus
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_method: string | null
  paid_at: string | null
  due_date: string | null
  notes: string | null
  active_payment_id: string | null
  voucher_id: string | null
  voucher_code: string | null
  voucher_discount_amount: number
  created_at: string
  updated_at: string
}
