import type { Hire } from '@context/connectionStore'
import type { CatalogCompany, CatalogJob } from '@context/catalogStore'
import type { ReviewItem } from '@services/connectionService'

/** Xác nhận nhận việc không phải bằng chứng đã hoàn thành ca. Không dùng dữ liệu mẫu để tra tên. */
export function seekerWorkHistory(userId: string, hires: Hire[], jobs: CatalogJob[], companies: CatalogCompany[], reviews: ReviewItem[]) {
  const history = hires.filter((h) => h.seekerId === userId && h.status === 'accepted')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((hire) => {
      const job = jobs.find((j) => j.id === hire.jobId)
      return { hire, job, company: companies.find((c) => c.id === job?.companyId), review: reviews.find((r) => r.jobId === hire.jobId) }
    })
  return {
    history,
    companyCount: new Set(history.flatMap(({ job }) => job ? [job.companyId] : [])).size,
    missingCompany: history.some(({ company }) => !company),
    average: reviews.length ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length : null,
    strengths: [...new Set(reviews.flatMap((r) => r.tags))],
  }
}
