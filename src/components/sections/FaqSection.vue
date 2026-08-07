<script setup lang="ts">
import { ref } from 'vue'

interface FaqItem {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: 'Apa itu ZXcoderID Cloud dan apa bedanya dengan hosting biasa?',
    answer: 'ZXcoderID Cloud adalah platform cloud hosting berbasis VPS (Virtual Private Server) dengan teknologi NVMe SSD dan infrastruktur enterprise. Berbeda dengan shared hosting biasa, resource server sepenuhnya dedicated untuk Anda — tidak berbagi dengan pengguna lain — sehingga performa lebih stabil dan konsisten.',
  },
  {
    question: 'Berapa lama proses aktivasi server setelah pembayaran?',
    answer: 'Aktivasi dilakukan secara otomatis dan instan setelah pembayaran dikonfirmasi. Rata-rata server aktif dalam waktu kurang dari 2 menit. Anda akan langsung menerima detail akses via email dan panel.',
  },
  {
    question: 'Apakah saya bisa upgrade atau downgrade paket kapan saja?',
    answer: 'Ya, Anda bisa upgrade atau downgrade paket kapan saja langsung dari control panel tanpa perlu menghubungi support. Upgrade berlaku instan, downgrade berlaku di awal periode billing berikutnya. Tidak ada biaya penalti apapun.',
  },
  {
    question: 'Sistem operasi apa saja yang tersedia?',
    answer: 'Kami menyediakan berbagai pilihan OS: Ubuntu (18.04, 20.04, 22.04, 24.04), Debian (10, 11, 12), CentOS (7, 8 Stream), AlmaLinux, Rocky Linux, dan Windows Server (dengan biaya tambahan). Custom ISO juga tersedia untuk paket Pro ke atas.',
  },
  {
    question: 'Bagaimana cara kerja proteksi DDoS yang disediakan?',
    answer: 'Kami menggunakan sistem mitigasi DDoS berlapis dengan kapasitas hingga 10 Tbps. Traffic berbahaya diidentifikasi dan difilter secara real-time di network layer sebelum mencapai server Anda. Untuk paket Starter tersedia perlindungan basic layer 3/4, sedangkan Pro dan Enterprise mendapat proteksi layer 7 termasuk HTTP flood dan bot mitigation.',
  },
  {
    question: 'Apakah ada backup otomatis untuk data saya?',
    answer: 'Backup otomatis tersedia untuk paket Pro dan Enterprise dengan frekuensi harian dan retensi 7 hari. Untuk paket Starter, Anda bisa melakukan backup manual kapan saja melalui panel atau menggunakan snapshot berbayar (Rp 5.000/snapshot). Sangat disarankan untuk selalu memiliki backup sendiri.',
  },
  {
    question: 'Bagaimana cara menghubungi support jika ada masalah?',
    answer: 'Support tersedia 24/7 melalui beberapa channel: sistem ticket di panel (semua paket), live chat (paket Pro dan Enterprise), dan WhatsApp dedicated untuk paket Enterprise. Target respons waktu kami: ticket dijawab dalam 15 menit, live chat instan, dan WhatsApp dalam 5 menit.',
  },
]

const openIndex = ref<number | null>(null)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}

function handleKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle(index)
  }
}
</script>

<template>
  <section id="faq" class="section faq-section" aria-labelledby="faq-title">
    <div class="section-label" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M6 8V7.5c1.5 0 2-1 1-2S4 5 4 6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="6" cy="9.5" r="0.5" fill="currentColor"/>
      </svg>
      FAQ
    </div>

    <h2 id="faq-title" class="section-title">
      Pertanyaan yang<br>Sering Ditanyakan
    </h2>
    <p class="section-subtitle">
      Tidak menemukan jawaban yang dicari? Hubungi tim support kami yang siap membantu 24/7.
    </p>

    <div class="faq-list" role="list">
      <div
        v-for="(faq, i) in faqs"
        :key="faq.question"
        class="faq-item"
        :class="[{ open: openIndex === i }]"
        role="listitem"
      >
        <button
          class="faq-trigger"
          :aria-expanded="openIndex === i"
          :aria-controls="`faq-answer-${i}`"
          :id="`faq-btn-${i}`"
          @click="toggle(i)"
          @keydown="handleKeydown($event, i)"
        >
          <span class="faq-question">{{ faq.question }}</span>
          <span class="faq-chevron" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>

        <Transition name="faq-expand">
          <div
            v-if="openIndex === i"
            :id="`faq-answer-${i}`"
            class="faq-answer"
            role="region"
            :aria-labelledby="`faq-btn-${i}`"
          >
            <div class="faq-answer-inner">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Contact CTA -->
    <div class="faq-contact fade-in fade-in-delay-4">
      <div class="contact-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M18 13c0 .7-.2 1.4-.5 2L16 18c-4 0-7.3-1.5-10-4.5C3.3 10.7 2 7.5 2 4l2.5-1.5C5.1 2.2 5.8 2 6.5 2c.3 0 .7.2.9.5l2 3c.3.4.2.9-.1 1.2L8 7.8c.6 1.1 1.4 2 2.2 2.8.8.8 1.7 1.6 2.8 2.2l1.1-1.3c.3-.3.8-.4 1.2-.1l3 2c.3.2.5.6.5.9l.2-.3z" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="contact-text">
        <span class="contact-heading">Masih ada pertanyaan?</span>
        <span class="contact-sub">Tim kami siap membantu Anda 24 jam sehari, 7 hari seminggu.</span>
      </div>
      <a
        href="https://wa.me/6281234567890"
        target="_blank"
        rel="noopener noreferrer"
        class="contact-btn"
        aria-label="Hubungi support via WhatsApp"
      >
        Hubungi Support
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </a>
    </div>
  </section>
</template>

<style scoped>
.faq-section {
  padding-top: var(--space-14);
  padding-bottom: var(--space-14);
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.faq-item {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  transition:
    border-color var(--duration-fast) var(--ease-default),
    background var(--duration-fast) var(--ease-default);
}

.faq-item:hover,
.faq-item.open {
  border-color: var(--color-border-accent);
}

.faq-item.open {
  background: linear-gradient(160deg, rgba(59,130,246,0.05) 0%, var(--color-surface-card) 60%);
}

.faq-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.faq-trigger:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: -2px;
  border-radius: calc(var(--radius-md) - 1px);
}

.faq-question {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  line-height: var(--line-height-base);
  flex: 1;
}

.faq-item.open .faq-question {
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-semibold);
}

.faq-chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform var(--duration-fast) var(--ease-default), color var(--duration-fast);
  display: flex;
  align-items: center;
}

.faq-item.open .faq-chevron {
  transform: rotate(180deg);
  color: var(--color-accent-blue);
}

/* Answer — Vue Transition expand */
.faq-answer {
  overflow: hidden;
}

.faq-answer-inner {
  padding: 0 var(--space-5) var(--space-5);
  border-top: 1px solid var(--color-border-muted);
}

.faq-answer-inner p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  padding-top: var(--space-4);
}

/* Transition enter/leave */
.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: max-height var(--duration-fast) var(--ease-default),
              opacity var(--duration-fast) var(--ease-default);
  max-height: 500px;
  opacity: 1;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Contact */
.faq-contact {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;
}

.contact-icon {
  width: 40px;
  height: 40px;
  background: var(--color-accent-blue-muted);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.contact-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
}

.contact-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.contact-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent-blue);
  background: var(--color-accent-blue-muted);
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-md);
  transition:
    background var(--duration-instant),
    color var(--duration-instant),
    box-shadow var(--duration-instant);
}

.contact-btn:hover {
  background: var(--color-accent-blue);
  color: #fff;
  box-shadow: var(--shadow-glow);
}
</style>
