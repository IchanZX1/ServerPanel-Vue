import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import AdminLayout from '../components/layout/AdminLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useAdminAuthStore } from '../stores/adminAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/server',
      name: 'server',
      component: () => import('../views/ServerView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/invoice',
      name: 'invoice',
      component: () => import('../views/InvoiceView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/ContactView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('../views/KnowledgeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    // ── Admin routes ──────────────────────────────────────────────────────────
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/AdminLoginView.vue'),
      meta: { requiresAdminGuest: true },
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboardView.vue') },
        { path: 'users',     name: 'admin-users',     component: () => import('../views/admin/AdminUsersView.vue') },
        { path: 'servers',   name: 'admin-servers',   component: () => import('../views/admin/AdminServersView.vue') },
        { path: 'invoices',  name: 'admin-invoices',  component: () => import('../views/admin/AdminInvoicesView.vue') },
        { path: 'products',  name: 'admin-products',  component: () => import('../views/admin/AdminProductsView.vue') },
        { path: 'vouchers',  name: 'admin-vouchers',  component: () => import('../views/admin/AdminVouchersView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const adminAuth = useAdminAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresGuest && auth.isLoggedIn) {
    return { name: 'dashboard' }
  }
  if (to.meta.requiresAdmin && !adminAuth.isLoggedIn) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdminGuest && adminAuth.isLoggedIn) {
    return { name: 'admin-dashboard' }
  }
})

export default router
