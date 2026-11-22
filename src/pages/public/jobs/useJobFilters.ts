import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { filtersFromParams, filtersToParams, type JobFilters } from './catalog'

/**
 * Bộ lọc của trang Việc làm, đồng bộ với query của URL (đổi bộ lọc không thêm bước lịch sử).
 * `setFilters` (ô tìm kiếm, "Xóa bộ lọc") giữ nguyên nhóm đang chọn dù `next.category` trống;
 * chọn nhóm / quay về bộ chọn dùng `setCategory` — bước này THÊM lịch sử để nút Back về lại bộ chọn.
 */
export function useJobFilters() {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(key)), [key])
  const setFilters = useCallback(
    (next: JobFilters) => setParams(filtersToParams({ ...next, category: next.category || filters.category }), { replace: true }),
    [setParams, filters.category],
  )
  const setCategory = useCallback(
    (category: string, replace = false) => setParams(filtersToParams({ ...filters, category }), { replace }),
    [setParams, filters],
  )
  return { filters, setFilters, setCategory }
}
