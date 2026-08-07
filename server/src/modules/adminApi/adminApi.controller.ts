import type { Request, Response } from 'express'
import { findAdminByEmail } from '../admin/admin.repository.js'
import { comparePassword } from '../../utils/password.js'
import { signAccessToken } from '../../utils/token.js'

export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email dan password diperlukan' })
      return
    }

    const admin = await findAdminByEmail(email)
    if (!admin) {
      res.status(401).json({ success: false, message: 'Kredensial tidak valid' })
      return
    }

    const valid = await comparePassword(password, admin.password_hash)
    if (!valid) {
      res.status(401).json({ success: false, message: 'Kredensial tidak valid' })
      return
    }

    const accessToken = signAccessToken({ sub: admin.id, email: admin.email, role: 'admin' })

    res.json({
      success: true,
      data: {
        accessToken,
        admin: { id: admin.id, email: admin.email, name: admin.name },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message })
  }
}

export async function adminLogout(_req: Request, res: Response): Promise<void> {
  // JWT adalah stateless — client hapus token di localStorage
  res.json({ success: true, message: 'Logout berhasil' })
}
