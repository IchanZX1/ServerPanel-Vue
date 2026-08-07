import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { paymentLimiter, apiLimiter } from '../../middlewares/rateLimiter.js'
import * as controller from './payment.controller.js'

const router = Router()

router.post('/create', authenticate, paymentLimiter, controller.create)
router.post('/status', authenticate, apiLimiter,    controller.status)
router.post('/qris',   authenticate, apiLimiter,    controller.qris)

export default router
