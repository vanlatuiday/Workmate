import { create } from 'zustand'
import toast from 'react-hot-toast'
import api from '@services/api'
import { apiErrorMessage } from '@services/authService'
import { useAuthStore } from './authStore'
import type { DemoNotification, Side } from './connectionStore'

// Cài đặt của tài khoản đang đăng nhập — lưu trên máy chủ (GET/PATCH /settings); đổi là hiện ngay rồi gửi đi.
// Tắt một loại thông báo thì loại đó không hiện ở /thong-bao và không tính vào số chưa đọc.

export type NotificationKind = DemoNotification['kind']
export type ProfileVisibility = 'public' | 'connected' | 'hidden'
export type EmailDigest = 'instant' | 'daily' | 'off'

export interface SideSettings {
  /** Loại thông báo đang bật (thiếu khóa = bật) */
  notify: Partial<Record<NotificationKind, boolean>>
  /** Email thông báo: gửi ngay / tóm tắt 8:00 sáng (giờ VN) / tắt — backend gửi thật */
  emailDigest: EmailDigest
  /** Người tìm việc: ai xem được hồ sơ (máy chủ áp dụng) · Doanh nghiệp: công khai trang công ty */
  visibility: ProfileVisibility
}

const DEFAULTS: SideSettings = { notify: {}, emailDigest: 'daily', visibility: 'public' }

interface SettingsState {
  bySide: Record<Side, SideSettings>
  update: (side: Side, patch: Partial<SideSettings>) => void
  setNotify: (side: Side, kind: NotificationKind, on: boolean) => Promise<void>
  load: (side: Side) => Promise<void>
  reset: () => void
}

/** Gửi thay đổi lên máy chủ; lỗi thì nạp lại giá trị thật. Khách không có gì để gửi */
async function save(side: Side, patch: Record<string, unknown>) {
  if (!useAuthStore.getState().token) return
  try {
    await api.patch('/settings', patch)
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Chưa lưu được cài đặt, vui lòng thử lại.'))
    await useSettingsStore.getState().load(side).catch(() => undefined)
  }
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  bySide: { seeker: DEFAULTS, recruiter: DEFAULTS },
  update: (side, patch) => {
    set((s) => ({ bySide: { ...s.bySide, [side]: { ...s.bySide[side], ...patch } } }))
    void save(side, patch)
  },
  setNotify: async (side, kind, on) => {
    set((s) => ({ bySide: { ...s.bySide, [side]: { ...s.bySide[side], notify: { ...s.bySide[side].notify, [kind]: on } } } }))
    await save(side, { notify: { [kind]: on } })
  },
  load: async (side) => {
    const { data } = await api.get<SideSettings>('/settings')
    set((s) => ({ bySide: { ...s.bySide, [side]: data } }))
  },
  reset: () => set({ bySide: { seeker: DEFAULTS, recruiter: DEFAULTS } }),
}))

/** Loại thông báo này có đang bật không (mặc định bật) */
export const isNotifyOn = (s: SideSettings, kind: NotificationKind) => s.notify[kind] !== false
