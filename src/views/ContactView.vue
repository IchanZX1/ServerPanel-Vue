<script setup lang="ts">
import { Headphones, MessageSquare, Mail } from 'lucide-vue-next'
</script>

<template>
  <div class="contact-page">
    <div class="page-header">
      <h2 class="header-title">Contact Support</h2>
      <p class="header-subtitle">Need help with your server? Reach out to our technical support team.</p>
    </div>

    <div class="contact-cards-grid">
      <div class="contact-card">
        <div class="icon-box">
          <Headphones :size="24" />
        </div>
        <h3 class="card-title">Live Chat Support</h3>
        <p class="card-desc">Available 24/7 for urgent server issues.</p>
        <button class="action-btn">Start Chat</button>
      </div>

      <div class="contact-card">
        <div class="icon-box">
          <MessageSquare :size="24" />
        </div>
        <h3 class="card-title">WhatsApp Community</h3>
        <p class="card-desc">Join our official community group for discussion.</p>
        <button class="action-btn">Join Group</button>
      </div>

      <div class="contact-card">
        <div class="icon-box">
          <Mail :size="24" />
        </div>
        <h3 class="card-title">Email Desk</h3>
        <p class="card-desc">Send us your detailed inquiry via email ticket.</p>
        <button class="action-btn">Send Email</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--panel-text-title);
}

.header-subtitle {
  font-size: 14px;
  color: var(--panel-text-faint);
}

.contact-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.contact-card {
  background: var(--panel-bg-card);
  border: 1px solid var(--panel-border-card);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 163, 255, 0.12);
  color: #00a3ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--panel-text-title);
}

.card-desc {
  font-size: 13px;
  color: var(--panel-text-muted);
  line-height: 1.5;
}

.action-btn {
  margin-top: 8px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(0, 163, 255, 0.15);
  border: 1px solid rgba(0, 163, 255, 0.3);
  color: #00a3ff;
  font-size: 13px;
  font-weight: 600;
  transition: var(--transition-fast);
}

.action-btn:hover {
  background: #00a3ff;
  color: #ffffff;
}

@media (max-width: 768px) {
  .contact-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
