import { Component, useSyncExternalStore, type ErrorInfo, type ReactNode } from 'react'

/**
 * Trạng thái dùng chung "lớp hạt hỏng" (không có WebGL, shader lỗi, mất context không khôi
 * phục được, chunk tải lỗi…). HomePage và IntroHero cùng đọc: khi hỏng thì logo header
 * không còn bị ẩn mà quay về tween logo bay cũ — logo không bao giờ biến mất.
 * Giữ cho tới khi tải lại trang.
 */
let failed = false
const listeners = new Set<() => void>()

export function markParticlesFailed() {
  if (failed) return
  failed = true
  listeners.forEach((l) => l())
}

export function useParticlesFailed() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => failed,
    () => false,
  )
}

/** Lỗi khi tải/dựng lớp hạt → không render gì và đánh dấu hỏng, không làm sập trang. */
export class ParticleBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[ParticleField]', error, info.componentStack)
    markParticlesFailed()
  }
  render() {
    return this.state.error ? null : this.props.children
  }
}
