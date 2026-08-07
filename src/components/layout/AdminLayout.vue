<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LayoutGrid, Users, Server, CreditCard, Package, Tag, LogOut, Menu, X
} from 'lucide-vue-next'
import { useAdminAuthStore } from '../../stores/adminAuth'

const router = useRouter()
const route = useRoute()
const adminAuth = useAdminAuthStore()
const sidebarOpen = ref(false)

const navItems = [
  { name: 'Dashboard',  path: '/admin/dashboard', icon: LayoutGrid },
  { name: 'Users',      path: '/admin/users',      icon: Users },
  { name: 'Servers',    path: '/admin/servers',    icon: Server },
  { name: 'Invoices',   path: '/admin/invoices',   icon: CreditCard },
  { name: 'Products',   path: '/admin/products',   icon: Package },
  { name: 'Vouchers',   path: '/admin/vouchers',   icon: Tag },
]

const isActive = (path: string) => route.path === path

async function handleLogout() {
  await adminAuth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin-layout">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <span class="sidebar-brand">Admin Panel</span>
        <button class="close-btn" @click="sidebarOpen = false"><X :size="18" /></button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-info">
          <span class="admin-email">{{ adminAuth.user?.email }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <LogOut :size="16" />
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="admin-main">
      <header class="admin-topbar">
        <button class="menu-btn" @click="sidebarOpen = true"><Menu :size="20" /></button>
        <span class="topbar-title">{{ navItems.find(n => isActive(n.path))?.name ?? 'Admin' }}</span>
      </header>
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #0f172a;
  color: #f1f5f9;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 99;
}

.admin-sidebar {
  width: 240px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #1e293b;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: transform 0.25s ease;
}

.sidebar-header {
  padding: 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #334155;
}

.sidebar-brand {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
}

.close-btn {
  color: #94a3b8;
  display: none;
  background: none;
  border: none;
  cursor: pointer;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: #334155;
  color: #f1f5f9;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid #334155;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-info {
  padding: 4px 0;
}

.admin-email {
  font-size: 12px;
  color: #64748b;
  word-break: break-all;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.admin-main {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-topbar {
  height: 56px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.menu-btn {
  color: #94a3b8;
  background: none;
  border: none;
  cursor: pointer;
  display: none;
}

.topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

@media (max-width: 991px) {
  .admin-sidebar {
    transform: translateX(-100%);
  }
  .admin-sidebar.open {
    transform: translateX(0);
  }
  .close-btn { display: flex; }
  .menu-btn { display: flex; }
  .admin-main { margin-left: 0; }
}
</style>
