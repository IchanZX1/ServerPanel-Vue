<script setup lang="ts">
import { ref } from 'vue'
import {
  X,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  KeyRound,
  User,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Globe
} from 'lucide-vue-next'
import type { ServerItem } from '../../data/dummyData'

const props = defineProps<{
  isOpen: boolean
  server: ServerItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// Password Sensor Visibility State
const showPassword = ref(false)

// Copy State Feedback
const copiedField = ref<'username' | 'password' | 'ip' | null>(null)

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value
}

const copyToClipboard = (text: string, field: 'username' | 'password' | 'ip') => {
  navigator.clipboard.writeText(text)
  copiedField.value = field
  setTimeout(() => {
    copiedField.value = null
  }, 2000)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && server" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-card">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-main">
              <div class="server-icon-box">
                <Server :size="24" />
              </div>
              <div class="header-titles">
                <div class="title-row">
                  <h2 class="server-title">{{ server.name }}</h2>
                  <span class="status-badge" :class="server.status">
                    <span class="badge-dot"></span>
                    {{ server.status === 'active' ? 'Active' : 'Suspended' }}
                  </span>
                </div>
                <span class="server-id">ID: {{ server.id }}</span>
              </div>
            </div>
            <button class="close-btn" @click="emit('close')">
              <X :size="20" />
            </button>
          </div>

          <div class="modal-body">
            <!-- SPECIFICATIONS SECTION -->
            <div class="section-container">
              <h3 class="section-label">Server Specifications</h3>
              <div class="specs-grid">
                <div class="spec-card">
                  <Cpu :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">CPU Allocation</span>
                    <span class="spec-val">{{ server.specs?.cpu || '30% CPU Allocation' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <User :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">RAM Allocation</span>
                    <span class="spec-val">{{ server.specs?.ram || '1 GB RAM' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <HardDrive :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">Storage</span>
                    <span class="spec-val">{{ server.specs?.storage || server.storageType }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <Wifi :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">Bandwidth</span>
                    <span class="spec-val">{{ server.specs?.bandwidth || 'Unlimited Bandwidth' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <Globe :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">Node & IP Address</span>
                    <span class="spec-val">{{ server.ipAddress || '103.147.222.10:2022' }}</span>
                  </div>
                </div>

                <div class="spec-card">
                  <Calendar :size="18" class="spec-icon" />
                  <div class="spec-info">
                    <span class="spec-name">Active Until</span>
                    <span class="spec-val highlight-green">{{ server.activeUntil }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- PANEL CREDENTIALS SECTION -->
            <div class="section-container credentials-container">
              <div class="cred-header">
                <KeyRound :size="18" class="cred-icon" />
                <h3 class="section-label">Panel Login Credentials</h3>
              </div>

              <div class="credentials-form">
                <!-- Username Field -->
                <div class="field-group">
                  <label class="field-label">Panel Username</label>
                  <div class="field-box">
                    <span class="field-value">{{ server.panelUsername || 'ichanzx_srv01' }}</span>
                    <button
                      class="copy-btn"
                      @click="copyToClipboard(server.panelUsername || 'ichanzx_srv01', 'username')"
                      title="Copy Username"
                    >
                      <Check v-if="copiedField === 'username'" :size="16" class="check-icon" />
                      <Copy v-else :size="16" />
                    </button>
                  </div>
                </div>

                <!-- Password Field with Sensor Eye Toggle -->
                <div class="field-group">
                  <label class="field-label">Panel Password</label>
                  <div class="field-box">
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      class="field-input-password"
                      :value="server.panelPassword || 'P@ssw0rdZXcoder2026!'"
                      readonly
                    />
                    <!-- Eye Sensor Toggle Button -->
                    <button
                      class="eye-btn"
                      @click="toggleShowPassword"
                      :title="showPassword ? 'Hide Password' : 'Show Password'"
                    >
                      <EyeOff v-if="showPassword" :size="18" />
                      <Eye v-else :size="18" />
                    </button>
                    <!-- Copy Button -->
                    <button
                      class="copy-btn"
                      @click="copyToClipboard(server.panelPassword || 'P@ssw0rdZXcoder2026!', 'password')"
                      title="Copy Password"
                    >
                      <Check v-if="copiedField === 'password'" :size="16" class="check-icon" />
                      <Copy v-else :size="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Button: Open Panel Console -->
            <a
              href="https://panel.zxcoderid.com"
              target="_blank"
              class="login-panel-btn"
            >
              <span>Login to Panel Console</span>
              <ExternalLink :size="18" />
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 14, 0.8);
  backdrop-filter: blur(8px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 580px;
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  background: #0d1527;
  border: 1px solid #1c2a45;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 18px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.server-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 230, 118, 0.12);
  border: 1px solid rgba(0, 230, 118, 0.25);
  color: #00e676;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.server-title {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}

.server-id {
  font-size: 12px;
  color: #64748b;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-badge.active {
  background: rgba(0, 230, 118, 0.15);
  color: #00e676;
  border: 1px solid rgba(0, 230, 118, 0.3);
}

.status-badge.suspended {
  background: rgba(255, 77, 77, 0.15);
  color: #ff4d4d;
  border: 1px solid rgba(255, 77, 77, 0.3);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.spec-card {
  background: #111b2f;
  border: 1px solid #1a2947;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.spec-icon {
  color: #00a3ff;
  flex-shrink: 0;
}

.spec-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.spec-name {
  font-size: 11px;
  color: #64748b;
}

.spec-val {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight-green {
  color: #00e676;
}

/* CREDENTIALS */
.credentials-container {
  background: #091121;
  border: 1px solid #1a2845;
  border-radius: 16px;
  padding: 18px;
}

.cred-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.cred-icon {
  color: #b357ff;
}

.credentials-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 10px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.field-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #141f36;
  border: 1px solid #223456;
  border-radius: 10px;
  padding: 10px 14px;
}

.field-value {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.field-input-password {
  background: none;
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  flex: 1;
  letter-spacing: 1px;
}

.eye-btn, .copy-btn {
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: var(--transition-fast);
}

.eye-btn:hover, .copy-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.check-icon {
  color: #00e676;
}

.login-panel-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  background: #0d47a1;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  transition: var(--transition-fast);
  box-shadow: 0 4px 15px rgba(13, 71, 161, 0.3);
}

.login-panel-btn:hover {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 71, 161, 0.4);
}

@media (max-width: 640px) {
  .specs-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

@media (max-width: 560px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal-card {
    padding: 18px;
    border-radius: 16px;
    gap: 14px;
  }

  .modal-body {
    gap: 14px;
  }

  .modal-header {
    padding-bottom: 12px;
  }

  .header-main {
    gap: 10px;
  }

  .server-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .title-row {
    flex-wrap: wrap;
  }

  .server-title {
    font-size: 15px;
  }

  .section-label {
    font-size: 11px;
  }

  .spec-card {
    padding: 8px 10px;
    gap: 8px;
  }

  .spec-icon {
    width: 16px;
    height: 16px;
  }

  .spec-name {
    font-size: 9px;
  }

  .spec-val {
    font-size: 11px;
    white-space: normal;
    overflow: visible;
    word-break: break-word;
  }

  .credentials-container {
    padding: 12px;
  }

  .field-label {
    font-size: 11px;
  }

  .field-box {
    padding: 8px 10px;
  }

  .field-value,
  .field-input-password {
    font-size: 12px;
  }

  .login-panel-btn {
    padding: 12px;
    font-size: 13px;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
