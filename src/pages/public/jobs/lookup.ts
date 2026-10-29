// Tra cứu một tin theo id, kể cả tin đã bị ẩn/từ chối — để kết nối, lịch, thông báo cũ vẫn có tên vị trí.
import { SEEKER_JOBS, type MatchJob } from '@pages/public/match/data'
import { useAdminStore } from '@context/adminStore'

/** Tin có sẵn hoặc tin mới đăng (bất kể trạng thái kiểm duyệt) */
export const findAnyJob = (id: string): MatchJob | undefined =>
  SEEKER_JOBS.find((j) => j.id === id) ?? useAdminStore.getState().posted.find((j) => j.id === id)
