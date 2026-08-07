import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import devRouter from './modules/dev/dev.router.js'

// Routers
import authRouter from './modules/auth/auth.router.js'
import dashboardRouter from './modules/dashboard/dashboard.router.js'
import serverRouter from './modules/server/server.router.js'
import invoiceRouter from './modules/invoice/invoice.router.js'
import paymentRouter from './modules/payment/payment.router.js'
import orderRouter from './modules/order/order.router.js'
import contactRouter from './modules/contact/contact.router.js'
import voucherRouter from './modules/voucher/voucher.router.js'
import adminRouter from './modules/admin/admin.router.js'
import adminApiRouter from './modules/adminApi/adminApi.router.js'

const app = express()

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN : true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// ─── Trust proxy (untuk rate limiter IP yang benar di belakang nginx) ─────────
app.set('trust proxy', 1)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/server',    serverRouter)
app.use('/api/invoice',   invoiceRouter)
app.use('/api/payment',   paymentRouter)
app.use('/api/order',     orderRouter)
app.use('/api/contact',   contactRouter)
app.use('/api/vouchers',    voucherRouter)
app.use('/api/admin',      adminApiRouter)
app.use('/admin',          adminRouter)

// ─── DEV ONLY (tidak dimount di production) ───────────────────────────────────
if (env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRouter)
}

// ─── 404 & Error handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export default app
