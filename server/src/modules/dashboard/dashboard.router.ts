import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { apiLimiter } from '../../middlewares/rateLimiter.js'
import { getDashboard } from './dashboard.controller.js'

const router = Router()

router.post('/', authenticate, apiLimiter, getDashboard)

export default router
