import { db } from '../../config/db.js'
import type { UserRow } from '../../types/index.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, name, username, email, password_hash, avatar_initial, role,
            is_active, is_email_verified, login_fail_count, locked_until,
            pterodactyl_user_id, created_at, updated_at, deleted_at
     FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    [email],
  )
  return (rows[0] as UserRow) ?? null
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, name, username, email, password_hash, avatar_initial, role,
            is_active, is_email_verified, login_fail_count, locked_until,
            pterodactyl_user_id, created_at, updated_at, deleted_at
     FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id],
  )
  return (rows[0] as UserRow) ?? null
}

export async function emailExists(email: string): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email],
  )
  return rows.length > 0
}

export async function usernameExists(username: string): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT id FROM users WHERE username = ? AND deleted_at IS NULL LIMIT 1',
    [username],
  )
  return rows.length > 0
}

export async function createUser(data: {
  id: string
  name: string
  username: string
  email: string
  passwordHash: string
  avatarInitial: string
}): Promise<void> {
  await db.execute<ResultSetHeader>(
    `INSERT INTO users (id, name, username, email, password_hash, avatar_initial, role)
     VALUES (?, ?, ?, ?, ?, ?, 'customer')`,
    [data.id, data.name, data.username, data.email, data.passwordHash, data.avatarInitial],
  )
}

export async function updateLoginFail(userId: string, count: number, lockedUntil: Date | null): Promise<void> {
  await db.execute(
    'UPDATE users SET login_fail_count = ?, locked_until = ?, updated_at = NOW() WHERE id = ?',
    [count, lockedUntil, userId],
  )
}

export async function resetLoginFail(userId: string): Promise<void> {
  await db.execute(
    'UPDATE users SET login_fail_count = 0, locked_until = NULL, updated_at = NOW() WHERE id = ?',
    [userId],
  )
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await db.execute(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [passwordHash, userId],
  )
}

export async function updatePterodactylUserId(userId: string, pterodactylUserId: number): Promise<void> {
  await db.execute(
    'UPDATE users SET pterodactyl_user_id = ?, updated_at = NOW() WHERE id = ?',
    [pterodactylUserId, userId],
  )
}

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export async function saveRefreshToken(data: {
  id: string
  userId: string
  tokenHash: string
  userAgent: string | null
  ipAddress: string | null
  expiresAt: Date
}): Promise<void> {
  await db.execute(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.id, data.userId, data.tokenHash, data.userAgent, data.ipAddress, data.expiresAt],
  )
}

export async function findRefreshToken(tokenHash: string): Promise<{
  id: string
  user_id: string
  expires_at: string
  revoked_at: string | null
} | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, user_id, expires_at, revoked_at
     FROM refresh_tokens WHERE token_hash = ? LIMIT 1`,
    [tokenHash],
  )
  return (rows[0] as { id: string; user_id: string; expires_at: string; revoked_at: string | null }) ?? null
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await db.execute(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?',
    [tokenHash],
  )
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await db.execute(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
    [userId],
  )
}

// ─── Password reset tokens ────────────────────────────────────────────────────

export async function saveResetToken(data: {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
}): Promise<void> {
  // Hapus token lama milik user ini sebelum buat baru
  await db.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [data.userId])
  await db.execute(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [data.id, data.userId, data.tokenHash, data.expiresAt],
  )
}

export async function findResetToken(tokenHash: string): Promise<{
  id: string
  user_id: string
  expires_at: string
  used_at: string | null
} | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, user_id, expires_at, used_at
     FROM password_reset_tokens WHERE token_hash = ? LIMIT 1`,
    [tokenHash],
  )
  return (rows[0] as { id: string; user_id: string; expires_at: string; used_at: string | null }) ?? null
}

export async function markResetTokenUsed(tokenHash: string): Promise<void> {
  await db.execute(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?',
    [tokenHash],
  )
}
