import { create } from 'zustand'
import { useAuthStore } from './authStore'
import { useMessengerStore } from './messengerStore'

// Trạng thái popup thông báo nổi (không lưu). Chỉ một popup mở một lúc: mở thông báo thì đóng tin nhắn.
// (Chiều ngược lại — mở tin nhắn thì đóng thông báo — do NotificationCenter theo dõi.)
interface NotificationCenterState {
  open: boolean
  openCenter: () => void
  closeCenter: () => void
}

export const useNotificationCenterStore = create<NotificationCenterState>()((set) => ({
  open: false,
  openCenter: () => {
    // Chỉ người tìm việc / nhà tuyển dụng mới có popup này
    const role = useAuthStore.getState().user?.role
    if (role !== 'jobseeker' && role !== 'recruiter') return
    useMessengerStore.getState().closeMessenger()
    set({ open: true })
  },
  closeCenter: () => set({ open: false }),
}))
