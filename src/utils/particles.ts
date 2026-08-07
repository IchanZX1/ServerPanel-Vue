import { loadSlim } from '@tsparticles/slim'
import { tsParticles, MoveDirection, OutMode } from '@tsparticles/engine'
import type { ISourceOptions } from '@tsparticles/engine'

// Singleton flag — loadSlim hanya boleh dipanggil sekali per session
let initialized = false

export async function initParticles(): Promise<void> {
  if (initialized) return
  initialized = true
  await loadSlim(tsParticles)
}

export { tsParticles }

export const defaultParticlesOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ['#3b82f6', '#6366f1', '#8b5cf6'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 0.4 },
      animation: { enable: true, speed: 0.8, sync: false },
    },
    size: {
      value: { min: 1, max: 3 },
      animation: { enable: true, speed: 2, sync: false },
    },
    links: {
      enable: true,
      distance: 120,
      color: '#3b82f6',
      opacity: 0.15,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.6,
      direction: MoveDirection.none,
      random: true,
      straight: false,
      outModes: { default: OutMode.bounce },
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: 'grab' },
      onClick: { enable: false },
    },
    modes: {
      grab: { distance: 140, links: { opacity: 0.4 } },
    },
  },
  detectRetina: true,
}
