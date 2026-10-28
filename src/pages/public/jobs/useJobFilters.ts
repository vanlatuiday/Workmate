import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { filtersFromParams, filtersToParams, type JobFilters } from './catalog'

/** Bộ lọc của trang Việc làm, đồng bộ với query của URL (đổi bộ lọc không thêm bước lịch sử). */
export function useJobFilters() {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(key)), [key])
  const setFilters = useCallback((next: JobFilters) => setParams(filtersToParams(next), { replace: true }), [setParams])
  return { filters, setFilters }
}
