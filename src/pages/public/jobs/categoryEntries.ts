import type { MatchJob } from '@pages/public/match/data'
import { photoUrl, type Photo } from '@components/discover/types'
import { HOME_CATEGORIES, categoryOf, type HomeCategory } from '@components/home/categories'

/** Một nhóm có việc cho người đang xem (bộ chọn nhóm + hàng chip chuyển nhóm) */
export interface CategoryEntry {
  cat: HomeCategory
  /** Số việc của người đang xem trong nhóm */
  count: number
  /** Ảnh của việc đầu tiên: dùng cho nhóm không có ảnh tách nền ("Việc khác") */
  photo?: Photo
}

/** Chỉ các nhóm có ≥ 1 việc, theo thứ tự HOME_CATEGORIES */
export function categoryEntries(jobs: MatchJob[]): CategoryEntry[] {
  const by = new Map<string, CategoryEntry>()
  for (const j of jobs) {
    const cat = categoryOf(j)
    const e = by.get(cat.key)
    if (e) e.count += 1
    else by.set(cat.key, { cat, count: 1, photo: j.photo })
  }
  return HOME_CATEGORIES.flatMap((c) => by.get(c.key) ?? [])
}

/** Một bước của bộ sưu tập /viec-lam: một nhóm + các tin của nhóm (mới nhất trước) */
export interface CategoryGroup<J extends MatchJob = MatchJob> {
  cat: HomeCategory
  jobs: J[]
  newest: J
}

/** Gom việc theo nhóm (chỉ nhóm có tin, theo thứ tự HOME_CATEGORIES), mỗi nhóm xếp tin mới nhất lên đầu */
export function categoryGroups<J extends MatchJob & { postedAt?: string }>(jobs: J[]): CategoryGroup<J>[] {
  const by = new Map<string, J[]>()
  for (const j of jobs) {
    const k = categoryOf(j).key
    by.set(k, [...(by.get(k) ?? []), j])
  }
  return HOME_CATEGORIES.flatMap((cat) => {
    const list = by.get(cat.key)
    if (!list) return []
    const sorted = [...list].sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''))
    return [{ cat, jobs: sorted, newest: sorted[0] }]
  })
}

/** Ảnh giữa của một bước: ảnh tin mới nhất; không dùng được thì ảnh tách nền của nhóm */
export function groupPhoto(g: CategoryGroup): Photo {
  if (photoUrl(g.newest.photo, 640)) return g.newest.photo
  return g.cat.cutout ? { url: g.cat.cutout.src, alt: g.cat.cutout.alt } : g.newest.photo
}
