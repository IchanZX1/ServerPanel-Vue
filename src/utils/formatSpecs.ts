export function formatMB(mb: number): string {
  if (!mb || mb <= 0) return 'Unlimited'
  if (mb % 1024 === 0) return `${mb / 1024} GB`
  return `${mb} MB`
}

export function formatCPU(cpu: number): string {
  if (!cpu || cpu <= 0) return 'Unlimited'
  return `${cpu}% CPU`
}
