import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { apiLimiter, actionLimiter } from '../../middlewares/rateLimiter.js'
import * as controller from './server.controller.js'

const router = Router()

router.post('/list',     authenticate, apiLimiter,    controller.list)
router.post('/detail',   authenticate, apiLimiter,    controller.detail)
router.post('/renew',    authenticate, actionLimiter, controller.renew)
router.post('/downgrade',authenticate, actionLimiter, controller.downgrade)
router.post('/upgrade',  authenticate, actionLimiter, controller.upgrade)

export default router
