import type { CatalogJob } from '@context/catalogStore'

export function companyRecruitingJobs(jobs: CatalogJob[], companyId: string, now = Date.now()): CatalogJob[] {
  return jobs
    .filter((job) => job.companyId === companyId && job.visible && job.status === 'open' && job.moderation === 'approved'
      && (job.expiresAt === undefined || Date.parse(job.expiresAt) > now))
    .sort((a, b) => (Date.parse(b.postedAt) || 0) - (Date.parse(a.postedAt) || 0))
}
