import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { contactLimiter, apiLimiter } from '../../middlewares/rateLimiter.js'
import * as controller from './contact.controller.js'

const router = Router()

router.post('/send',   authenticate, contactLimiter, controller.send)
router.post('/list',   authenticate, apiLimiter,     controller.list)
router.post('/detail', authenticate, apiLimiter,     controller.detail)
router.post('/reply',  authenticate, apiLimiter,     controller.reply)

export default router
