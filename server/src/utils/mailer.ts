import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from './logger.js'

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT, 10),
  secure: parseInt(env.SMTP_PORT, 10) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

interface MailOptions {
  to: string
  subject: string
  html: string
}

export async function sendMail(opts: MailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    logger.info({ to: opts.to, subject: opts.subject }, '[mailer] email sent')
  } catch (err) {
    // Fire-and-forget — kegagalan email tidak boleh menghentikan proses utama
    logger.error({ err, to: opts.to }, '[mailer] failed to send email')
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

export function mailResetPassword(name: string, resetUrl: string): string {
  return `
    <h2>Reset Password</h2>
    <p>Halo ${name},</p>
    <p>Klik link berikut untuk mereset password Anda (berlaku 1 jam):</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
  `
}

export function mailServerSuspended(
  name: string,
  serverName: string,
  activeUntil: string,
  graceDeadline: string,
  renewUrl: string,
): string {
  return `
    <h2>Server Disuspend</h2>
    <p>Halo ${name},</p>
    <p>Server <strong>${serverName}</strong> telah disuspend karena masa aktif berakhir pada ${activeUntil}.</p>
    <p><strong>Perpanjang sebelum ${graceDeadline}</strong> atau server akan dihapus permanen.</p>
    <p><a href="${renewUrl}">Perpanjang Sekarang</a></p>
  `
}

export function mailServerSuspendedByAdmin(
  name: string,
  serverName: string,
  reason: string | null,
): string {
  return `
    <h2>Server Disuspend oleh Admin</h2>
    <p>Halo ${name},</p>
    <p>Server <strong>${serverName}</strong> telah disuspend oleh admin.</p>
    ${reason ? `<p>Alasan: ${reason}</p>` : ''}
    <p>Silakan hubungi admin untuk informasi lebih lanjut.</p>
  `
}

export function mailRenewalConfirmed(
  name: string,
  serverName: string,
  newActiveUntil: string,
  dashboardUrl: string,
): string {
  return `
    <h2>Pembayaran Dikonfirmasi</h2>
    <p>Halo ${name},</p>
    <p>Pembayaran perpanjangan server <strong>${serverName}</strong> berhasil dikonfirmasi.</p>
    <p>Server aktif hingga: <strong>${newActiveUntil}</strong></p>
    <p><a href="${dashboardUrl}">Lihat Dashboard</a></p>
  `
}

export function mailServerTerminated(
  name: string,
  serverName: string,
  terminatedAt: string,
): string {
  return `
    <h2>Server Dihapus</h2>
    <p>Halo ${name},</p>
    <p>Server <strong>${serverName}</strong> telah dihapus permanen pada ${terminatedAt} karena grace period habis.</p>
    <p>Data server tidak dapat dipulihkan. Invoice terkait masih tersimpan untuk referensi Anda.</p>
  `
}
