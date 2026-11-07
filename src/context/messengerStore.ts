import { create } from 'zustand'

// Trạng thái khung tin nhắn nổi (không lưu): mở/đóng + hội thoại đang xem.
// activeKey có dạng "jobId|seekerId"; null = đang ở danh sách hội thoại.
interface MessengerState {
  open: boolean
  activeKey: string | null
  openMessenger: (key?: string | null) => void
  closeMessenger: () => void
  setActiveKey: (key: string | null) => void
}

export const useMessengerStore = create<MessengerState>()((set) => ({
  open: false,
  activeKey: null,
  openMessenger: (key) => set({ open: true, activeKey: key ?? null }),
  closeMessenger: () => set({ open: false }),
  setActiveKey: (key) => set({ activeKey: key }),
}))
