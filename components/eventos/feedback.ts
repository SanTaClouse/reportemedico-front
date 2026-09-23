/**
 * Sonido y vibración para el escáner y la vista en vivo. El AudioContext solo
 * puede arrancar tras un toque del usuario (iOS), por eso `unlockAudio()` se
 * llama desde el botón que activa la cámara o el sonido.
 */

let ctx: AudioContext | null = null

export function unlockAudio() {
  if (typeof window === 'undefined') return
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  if (!ctx) ctx = new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
}

function tone(freq: number, startOffset: number, duration: number) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = freq
  osc.type = 'sine'
  const t = ctx.currentTime + startOffset
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

export type Feedback = 'ok' | 'warn' | 'error' | 'vip'

export function feedback(kind: Feedback) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(kind === 'ok' ? 80 : kind === 'vip' ? [100, 60, 100, 60, 200] : [200, 80, 200])
  }
  if (kind === 'ok') tone(1320, 0, 0.12)
  if (kind === 'warn') { tone(660, 0, 0.15); tone(660, 0.2, 0.15) }
  if (kind === 'error') { tone(330, 0, 0.25); tone(250, 0.28, 0.3) }
  if (kind === 'vip') { tone(880, 0, 0.12); tone(1175, 0.14, 0.12); tone(1568, 0.28, 0.25) }
}
