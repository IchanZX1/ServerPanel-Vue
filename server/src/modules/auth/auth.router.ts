import { Router } from 'express'
import * as controller from './auth.controller.js'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  loginLimiter,
  signupLimiter,
  forgotLimiter,
  resetLimiter,
  refreshLimiter,
  apiLimiter,
} from '../../middlewares/rateLimiter.js'
import { validate } from '../../middlewares/validate.js'
import { verifyTurnstile } from '../../middlewares/verifyTurnstile.js'
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema.js'

const router = Router()

router.post('/signup', signupLimiter, verifyTurnstile, validate(signupSchema), controller.signup)
router.post('/login', loginLimiter, verifyTurnstile, validate(loginSchema), controller.login)
router.post('/logout', authenticate, controller.logout)
router.post('/refresh', refreshLimiter, controller.refresh)
router.post('/forgot-password', forgotLimiter, validate(forgotPasswordSchema), controller.forgotPassword)
router.post('/reset-password', resetLimiter, validate(resetPasswordSchema), controller.resetPassword)
router.post('/change-password', authenticate, apiLimiter, validate(changePasswordSchema), controller.changePassword)

export default router
