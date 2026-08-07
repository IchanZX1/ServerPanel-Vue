import { Router } from 'express'
import * as ctrl from './admin.controller.js'

const router = Router()

// ─── Auth (no session required) ───────────────────────────────────────────────
router.get('/login',  ctrl.getLogin)
router.post('/login', ctrl.postLogin)
router.get('/logout', ctrl.getLogout)

// ─── All routes below require admin session ───────────────────────────────────
router.use(ctrl.requireAdminSession)

// Dashboard
router.get('/dashboard', ctrl.getDashboard)

// Users
router.get('/users',         ctrl.getUsers)
router.get('/users/:id',     ctrl.getUserDetail)
router.delete('/users/:id',  ctrl.deleteUser)

// Servers
router.get('/servers',                    ctrl.getServers)
router.post('/servers/:id/suspend',       ctrl.suspendServer)
router.post('/servers/:id/unsuspend',     ctrl.unsuspendServer)
router.delete('/servers/:id',             ctrl.deleteServer)

// Invoices
router.get('/invoices',              ctrl.getInvoices)
router.post('/invoices/:id/confirm', ctrl.confirmInvoice)

// Tickets
router.get('/tickets',              ctrl.getTickets)
router.post('/tickets/:id/reply',   ctrl.replyTicket)

// Products
router.get('/products',          ctrl.getProducts)
router.post('/products',         ctrl.createProduct)
router.patch('/products/:id',    ctrl.updateProduct)
router.delete('/products/:id',   ctrl.deleteProduct)

// Vouchers
router.get('/vouchers',           ctrl.getVouchers)
router.post('/vouchers',          ctrl.createVoucher)
router.patch('/vouchers/:id/toggle', ctrl.toggleVoucher)
router.delete('/vouchers/:id',    ctrl.deleteVoucher)

// Settings
router.post('/settings/change-password', ctrl.changePassword)

export default router
