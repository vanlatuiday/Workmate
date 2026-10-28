import type { InterviewMode } from '@services/connectionService'

/** Giờ đầy đủ: "Thứ Năm, 05/11, 15:00" */
export const fmtSlot = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** Giờ ngắn cho chip: "T5, 05/11, 15:00" */
export const fmtShort = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export const MODE_LABEL: Record<InterviewMode, string> = { onsite: 'Trực tiếp', online: 'Online' }
