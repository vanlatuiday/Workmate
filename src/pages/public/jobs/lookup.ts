// Tra cứu một tin theo id, kể cả tin đã bị ẩn/từ chối — để kết nối, lịch, thông báo cũ vẫn có tên vị trí.
import { SEEKER_JOBS, type MatchJob } from '@pages/public/match/data'
import { useCatalogStore } from '@context/catalogStore'
import { IS_PRODUCTION } from '@utils/isProduction'

/** Tin trong danh mục (bất kể trạng thái); id không có trong danh mục thì thử dữ liệu mẫu */
export const findAnyJob = (id: string): MatchJob | undefined =>
  useCatalogStore.getState().jobs.find((j) => j.id === id) ?? (IS_PRODUCTION ? undefined : SEEKER_JOBS.find((j) => j.id === id))
