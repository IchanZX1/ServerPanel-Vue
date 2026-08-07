import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { apiLimiter } from '../../middlewares/rateLimiter.js'
import * as controller from './voucher.controller.js'

const router = Router()

router.post('/validate', authenticate, apiLimiter, controller.validate)

export default router
