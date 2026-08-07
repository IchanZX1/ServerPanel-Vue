import { Router } from 'express'
import { adminLogin, adminLogout } from './adminApi.controller.js'
import * as adminCtrl from '../admin/admin.controller.js'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'

const router = Router()

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/login',  adminLogin)

// ─── All routes below require JWT admin auth ──────────────────────────────────
router.use(authenticate, requireRole('admin'))

router.post('/logout', adminLogout)

// Dashboard
router.get('/dashboard', adminCtrl.getDashboard)

// Users
router.get('/users',         adminCtrl.getUsers)
router.get('/users/:id',     adminCtrl.getUserDetail)
router.delete('/users/:id',  adminCtrl.deleteUser)

// Servers
router.get('/servers',                    adminCtrl.getServers)
router.post('/servers/:id/suspend',       adminCtrl.suspendServer)
router.post('/servers/:id/unsuspend',     adminCtrl.unsuspendServer)
router.delete('/servers/:id',             adminCtrl.deleteServer)

// Invoices
router.get('/invoices',              adminCtrl.getInvoices)
router.post('/invoices/:id/confirm', adminCtrl.confirmInvoice)

// Products
router.get('/products',          adminCtrl.getProducts)
router.post('/products',         adminCtrl.createProduct)
router.patch('/products/:id',    adminCtrl.updateProduct)
router.delete('/products/:id',   adminCtrl.deleteProduct)

// Vouchers
router.get('/vouchers',              adminCtrl.getVouchers)
router.post('/vouchers',             adminCtrl.createVoucher)
router.patch('/vouchers/:id/toggle', adminCtrl.toggleVoucher)
router.delete('/vouchers/:id',       adminCtrl.deleteVoucher)

// Tickets
router.get('/tickets',             adminCtrl.getTickets)
router.post('/tickets/:id/reply',  adminCtrl.replyTicket)

// Settings
router.post('/settings/change-password', adminCtrl.changePassword)

export default router
