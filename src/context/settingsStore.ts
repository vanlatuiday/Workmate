import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DemoNotification, Side } from '@context/demoStore'

// Cài đặt tài khoản demo — lưu localStorage (`workmate-settings`), riêng cho từng phía.
// Tắt một loại thông báo thì loại đó không hiện ở /thong-bao và không tính vào số chưa đọc.

export type NotificationKind = DemoNotification['kind']
export type ProfileVisibility = 'public' | 'connected' | 'hidden'
export type EmailDigest = 'instant' | 'daily' | 'off'

export interface SideSettings {
  /** Loại thông báo đang bật (thiếu khóa = bật) */
  notify: Partial<Record<NotificationKind, boolean>>
  /** Gửi email tóm tắt (giao diện mẫu — chưa gửi thật) */
  emailDigest: EmailDigest
  /** Người tìm việc: ai xem được hồ sơ · Doanh nghiệp: công khai trang công ty */
  visibility: ProfileVisibility
}

const DEFAULTS: SideSettings = { notify: {}, emailDigest: 'daily', visibility: 'public' }

interface SettingsState {
  bySide: Record<Side, SideSettings>
  update: (side: Side, patch: Partial<SideSettings>) => void
  setNotify: (side: Side, kind: NotificationKind, on: boolean) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      bySide: { seeker: DEFAULTS, recruiter: DEFAULTS },
      update: (side, patch) => set((s) => ({ bySide: { ...s.bySide, [side]: { ...s.bySide[side], ...patch } } })),
      setNotify: (side, kind, on) =>
        set((s) => ({ bySide: { ...s.bySide, [side]: { ...s.bySide[side], notify: { ...s.bySide[side].notify, [kind]: on } } } })),
      reset: () => set({ bySide: { seeker: DEFAULTS, recruiter: DEFAULTS } }),
    }),
    { name: 'workmate-settings', version: 1, partialize: (s) => ({ bySide: s.bySide }) },
  ),
)

/** Loại thông báo này có đang bật không (mặc định bật) */
export const isNotifyOn = (s: SideSettings, kind: NotificationKind) => s.notify[kind] !== false
