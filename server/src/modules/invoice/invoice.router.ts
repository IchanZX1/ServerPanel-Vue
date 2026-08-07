import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { apiLimiter } from '../../middlewares/rateLimiter.js'
import * as controller from './invoice.controller.js'

const router = Router()

router.post('/list',   authenticate, apiLimiter, controller.list)
router.post('/detail', authenticate, apiLimiter, controller.detail)

export default router
