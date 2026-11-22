import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { GalleryItem } from '@components/discover/types'
import { jobDetailHref } from '@components/jobs/jobDetailHref'
import type { CatalogJob } from '@context/catalogStore'
import { jobMatches, type JobFilters } from './catalog'
import { categoryGroups, groupPhoto, type CategoryGroup } from './categoryEntries'

export type CategoryItem = GalleryItem & { group: CategoryGroup<CatalogJob> }

/**
 * Bước của bộ sưu tập /viec-lam cho khách / người tìm việc: mỗi nhóm có việc (sau bộ lọc của ô tìm kiếm) là một bước,
 * ảnh = tin mới nhất của nhóm, bấm ảnh mở popup tin đó. `deps` chỉ để kích tính lại (kiểm duyệt, hồ sơ…).
 */
export function useCategoryItems(jobs: CatalogJob[], filters: JobFilters, deps: unknown[]) {
  const { pathname, search, hash } = useLocation()
  const { q, district, type, minSalaryK, nearMe } = filters
  return useMemo<CategoryItem[]>(() => {
    const f: JobFilters = { q, district, type, minSalaryK, nearMe, category: '' } // nhóm chọn ở hàng bước, không lọc ở đây
    const loc = { pathname, search, hash }
    return categoryGroups(jobs.filter((j) => jobMatches(j, f))).map((group) => ({
      id: group.cat.key,
      title: group.cat.label,
      href: jobDetailHref(group.newest.id, loc),
      popup: true,
      photo: groupPhoto(group),
      cursor: 'Xem tin',
      linkLabel: `Xem tin mới nhất nhóm ${group.cat.label}: ${group.newest.title}`,
      group,
    }))
  }, [jobs, q, district, type, minSalaryK, nearMe, pathname, search, hash, ...deps])
}

/** Bước mở sẵn: vị trí nhóm đang chọn trong danh sách; "Tất cả" hoặc không thấy → bước đầu */
export const initialStep = (items: { id: string }[], category: string) => Math.max(0, items.findIndex((x) => x.id === category))
