import { v4 as uuid } from 'uuid'
import { hashPassword, comparePassword } from '../../utils/password.js'
import { signAccessToken, signRefreshToken } from '../../utils/token.js'
import { hashToken, generateSecureToken } from '../../utils/crypto.js'
import { sendMail, mailResetPassword } from '../../utils/mailer.js'
import * as repo from './auth.repository.js'
import type { SignupInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema.js'

const MAX_LOGIN_FAILS = 5
const LOCK_DURATION_MINUTES = 15

export async function signup(input: SignupInput) {
  if (await repo.emailExists(input.email)) {
    throw new Error('Email sudah terdaftar')
  }
  if (await repo.usernameExists(input.username)) {
    throw new Error('Username sudah dipakai')
  }

  const userId = uuid()
  const passwordHash = await hashPassword(input.password)
  const avatarInitial = input.name.slice(0, 2).toUpperCase()

  await repo.createUser({
    id: userId,
    name: input.name,
    username: input.username,
    email: input.email,
    passwordHash,
    avatarInitial,
  })

  return { userId, message: 'Registrasi berhasil. Silakan login.' }
}

export async function login(
  input: LoginInput,
  userAgent: string | null,
  ipAddress: string | null,
) {
  const user = await repo.findUserByEmail(input.email)
  if (!user) {
    throw new Error('Email atau password salah')
  }

  // Cek apakah akun terkunci
  if (user.locked_until) {
    const lockedUntil = new Date(user.locked_until)
    if (lockedUntil > new Date()) {
      throw new Error(`Akun terkunci hingga ${lockedUntil.toLocaleString('id-ID')}`)
    }
  }

  // Cek password
  const valid = await comparePassword(input.password, user.password_hash)
  if (!valid) {
    const newFailCount = user.login_fail_count + 1
    let lockedUntil: Date | null = null
    if (newFailCount >= MAX_LOGIN_FAILS) {
      lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
    }
    await repo.updateLoginFail(user.id, newFailCount, lockedUntil)
    throw new Error('Email atau password salah')
  }

  // Reset login fail count
  if (user.login_fail_count > 0) {
    await repo.resetLoginFail(user.id)
  }

  // Generate tokens
  const payload = { sub: user.id, email: user.email, role: user.role }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  const refreshTokenHash = hashToken(refreshToken)

  // Simpan refresh token ke DB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 hari
  await repo.saveRefreshToken({
    id: uuid(),
    userId: user.id,
    tokenHash: refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatarInitial: user.avatar_initial,
    },
  }
}

export async function logout(refreshToken: string) {
  const refreshTokenHash = hashToken(refreshToken)
  await repo.revokeRefreshToken(refreshTokenHash)
  return { message: 'Logout berhasil' }
}

export async function refresh(
  oldRefreshToken: string,
  userAgent: string | null,
  ipAddress: string | null,
) {
  const tokenHash = hashToken(oldRefreshToken)
  const token = await repo.findRefreshToken(tokenHash)

  if (!token || token.revoked_at) {
    throw new Error('Refresh token tidak valid')
  }

  if (new Date(token.expires_at) < new Date()) {
    throw new Error('Refresh token expired')
  }

  const user = await repo.findUserById(token.user_id)
  if (!user) {
    throw new Error('User tidak ditemukan')
  }

  // Revoke old, issue new
  await repo.revokeRefreshToken(tokenHash)

  const payload = { sub: user.id, email: user.email, role: user.role }
  const accessToken = signAccessToken(payload)
  const newRefreshToken = signRefreshToken(payload)
  const newRefreshTokenHash = hashToken(newRefreshToken)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await repo.saveRefreshToken({
    id: uuid(),
    userId: user.id,
    tokenHash: newRefreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
  })

  return { accessToken, refreshToken: newRefreshToken }
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await repo.findUserByEmail(input.email)
  if (!user) {
    // Jangan bocorkan info email tidak terdaftar
    return { message: 'Jika email terdaftar, link reset password telah dikirim.' }
  }

  const resetToken = generateSecureToken(32)
  const tokenHash = hashToken(resetToken)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 jam

  await repo.saveResetToken({
    id: uuid(),
    userId: user.id,
    tokenHash,
    expiresAt,
  })

  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`
  sendMail({
    to: user.email,
    subject: 'Reset Password',
    html: mailResetPassword(user.name, resetUrl),
  })

  return { message: 'Jika email terdaftar, link reset password telah dikirim.' }
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashToken(input.token)
  const token = await repo.findResetToken(tokenHash)

  if (!token || token.used_at) {
    throw new Error('Token tidak valid atau sudah digunakan')
  }

  if (new Date(token.expires_at) < new Date()) {
    throw new Error('Token expired')
  }

  const passwordHash = await hashPassword(input.newPassword)
  await repo.updatePassword(token.user_id, passwordHash)
  await repo.markResetTokenUsed(tokenHash)
  await repo.revokeAllUserRefreshTokens(token.user_id)

  return { message: 'Password berhasil diubah. Silakan login dengan password baru.' }
}
