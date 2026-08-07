import { Router } from 'express'
import { env } from '../../config/env.js'
import { authenticate } from '../../middlewares/authenticate.js'
import { provisionServer } from './dev.controller.js'

const router = Router()

if (env.NODE_ENV !== 'production') {
  // ─── DEV ONLY — provisioning server tanpa pembayaran ───────────────────────
  router.post('/provision-server', authenticate, provisionServer)
}

export default router
