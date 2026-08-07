import rateLimit from 'express-rate-limit'

const windowMs = (minutes: number) => minutes * 60 * 1000

// Auth endpoints — ketat
export const loginLimiter = rateLimit({
  windowMs: windowMs(15),
  max: 5,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const signupLimiter = rateLimit({
  windowMs: windowMs(60),
  max: 3,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: { success: false, message: 'Terlalu banyak pendaftaran. Coba lagi dalam 1 jam.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const forgotLimiter = rateLimit({
  windowMs: windowMs(60),
  max: 3,
  keyGenerator: (req) => `${req.ip}:${(req.body as { email?: string }).email ?? ''}`,
  message: { success: false, message: 'Terlalu banyak permintaan reset. Coba lagi dalam 1 jam.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const resetLimiter = rateLimit({
  windowMs: windowMs(60),
  max: 5,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: { success: false, message: 'Terlalu banyak percobaan reset. Coba lagi dalam 1 jam.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const refreshLimiter = rateLimit({
  windowMs: windowMs(15),
  max: 20,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: { success: false, message: 'Rate limit exceeded.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})

// API endpoints — per user ID (sub dari JWT)
export const apiLimiter = rateLimit({
  windowMs: windowMs(1),
  max: 60,
  keyGenerator: (req) => req.user?.sub ?? req.ip ?? 'unknown',
  message: { success: false, message: 'Terlalu banyak request. Coba lagi dalam 1 menit.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const actionLimiter = rateLimit({
  windowMs: windowMs(60),
  max: 5,
  keyGenerator: (req) => req.user?.sub ?? req.ip ?? 'unknown',
  message: { success: false, message: 'Terlalu banyak aksi. Coba lagi dalam 1 jam.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const contactLimiter = rateLimit({
  windowMs: windowMs(60),
  max: 5,
  keyGenerator: (req) => req.user?.sub ?? req.ip ?? 'unknown',
  message: { success: false, message: 'Terlalu banyak tiket. Coba lagi dalam 1 jam.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const paymentLimiter = rateLimit({
  windowMs: windowMs(60),
  max: 5,
  keyGenerator: (req) => req.user?.sub ?? req.ip ?? 'unknown',
  message: { success: false, message: 'Terlalu banyak transaksi. Coba lagi dalam 1 jam.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
})
