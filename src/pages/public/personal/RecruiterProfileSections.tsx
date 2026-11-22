import { useCompanyStore } from '@context/companyStore'
import { useCatalogStore } from '@context/catalogStore'
import CompanyProfileCards from './CompanyProfileCards'
import { companyRecruitingJobs } from './companyRecruitingJobs'
import type { CompanyEditSection } from './companyProfilePresentation'

export default function RecruiterProfileSections({ onEdit }: { onEdit?: (section: CompanyEditSection) => void }) {
  const profile = useCompanyStore((s) => s.profile)
  const address = useCompanyStore((s) => s.address)
  const companyId = useCompanyStore((s) => s.id)
  const catalogJobs = useCatalogStore((s) => s.jobs)
  const jobs = companyRecruitingJobs(catalogJobs, companyId)

  return <CompanyProfileCards company={{ ...profile, address }} jobs={jobs} onEdit={onEdit} />
}
