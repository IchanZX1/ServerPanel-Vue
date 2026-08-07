import type { Request, Response } from 'express'
import * as service from './auth.service.js'
import * as repo from './auth.repository.js'
import { blacklistToken } from '../../utils/tokenBlacklist.js'
import { hashToken } from '../../utils/crypto.js'
import { hashPassword, comparePassword } from '../../utils/password.js'
import { ok, created, fail, unauthorized } from '../../utils/responseBuilder.js'
import type {
  SignupInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './auth.schema.js'

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.signup(req.body as SignupInput)
    created(res, result)
  } catch (err) {
    fail(res, (err as Error).message)
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const userAgent = req.headers['user-agent'] ?? null
    const ipAddress = req.ip ?? null
    const result = await service.login(req.body as LoginInput, userAgent, ipAddress)

    // Set refresh token sebagai httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      path: '/api/auth',
    })

    ok(res, {
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (err) {
    fail(res, (err as Error).message, 401, 'INVALID_CREDENTIALS')
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined
    const authHeader = req.headers.authorization
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken)
      await repo.revokeRefreshToken(tokenHash)
    }

    if (accessToken) {
      await blacklistToken(accessToken)
    }

    // Clear cookie
    res.clearCookie('refreshToken', { path: '/api/auth' })

    ok(res, { message: 'Logout berhasil' })
  } catch (err) {
    fail(res, (err as Error).message)
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined
    if (!refreshToken) {
      unauthorized(res, 'Refresh token tidak ditemukan')
      return
    }

    const userAgent = req.headers['user-agent'] ?? null
    const ipAddress = req.ip ?? null
    const result = await service.refresh(refreshToken, userAgent, ipAddress)

    // Set new refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    })

    ok(res, { accessToken: result.accessToken })
  } catch (err) {
    unauthorized(res, (err as Error).message)
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.forgotPassword(req.body as ForgotPasswordInput)
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message)
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.resetPassword(req.body as ResetPasswordInput)
    ok(res, result)
  } catch (err) {
    fail(res, (err as Error).message, 400, 'INVALID_TOKEN')
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const input = req.body as ChangePasswordInput

    const user = await repo.findUserById(userId)
    if (!user) {
      fail(res, 'User tidak ditemukan', 404)
      return
    }

    const valid = await comparePassword(input.currentPassword, user.password_hash)
    if (!valid) {
      fail(res, 'Password lama tidak benar', 400, 'INVALID_PASSWORD')
      return
    }

    const newHash = await hashPassword(input.newPassword)
    await repo.updatePassword(userId, newHash)

    // Sync password ke Pterodactyl jika user punya akun pterodactyl
    if (user.pterodactyl_user_id) {
      // Import lazy untuk hindari circular dependency
      const { updatePterodactylUserPassword } = await import('../pterodactyl/pterodactyl.service.js')
      await updatePterodactylUserPassword(user.pterodactyl_user_id, input.newPassword).catch(
        (e: Error) => console.error('[changePassword] pterodactyl sync failed:', e.message),
      )
    }

    ok(res, { message: 'Password berhasil diubah' })
  } catch (err) {
    fail(res, (err as Error).message)
  }
}
