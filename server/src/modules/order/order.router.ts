import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { paymentLimiter } from '../../middlewares/rateLimiter.js'
import * as controller from './order.controller.js'

const router = Router()

router.post('/create', authenticate, paymentLimiter, controller.create)

export default router
