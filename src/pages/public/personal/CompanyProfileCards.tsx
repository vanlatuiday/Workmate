import { Link } from 'react-router-dom'
import {
  ArrowUpRight, Building2, BriefcaseBusiness, CalendarDays, Check, Clock3,
  Gift, MapPin, Pencil, Sparkles, Target, Users,
} from 'lucide-react'
import type { CatalogJob } from '@context/catalogStore'
import JobLinks from '@components/discover/detail/JobLinks'
import { COMPANY_SIZES, JOB_TYPES } from '@constants/index'
import { BTN_SECONDARY, BTN_SM, LINK } from '@utils/ui'
import { cn } from '@utils/cn'
import { Card, Detail } from './personalPrototypeParts'
import { companyProfileItems, companyRecruitmentFacts, type CompanyEditSection, type CompanyProfileData } from './companyProfilePresentation'

type Props = {
  company: CompanyProfileData
  jobs: CatalogJob[]
  onEdit?: (section: CompanyEditSection) => void
}

function ProfileList({ items }: { items?: string[] }) {
  const content = companyProfileItems(items)
  return content.length ? (
    <ul className="space-y-2">
      {content.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-page-muted">
        <Check aria-hidden className="mt-1 h-4 w-4 shrink-0 text-wm-ocean" />
        <span className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]">{item}</span>
      </li>)}
    </ul>
  ) : <p className="text-sm text-page-muted">Chưa cập nhật</p>
}

/** Cùng nội dung cho chủ doanh nghiệp và người xem; chỉ chủ có hành động sửa. */
export default function CompanyProfileCards({ company, jobs, onEdit }: Props) {
  const facts = companyRecruitmentFacts(jobs)
  const jobTypes = facts.jobTypes.map((type) => JOB_TYPES.find((item) => item.value === type)?.label ?? type)
  const size = COMPANY_SIZES.find((item) => item.value === company.size)?.label ?? company.size
  const address = company.address?.trim()
  const district = company.district?.trim()
  const edit = (section: CompanyEditSection, label: string) => onEdit && (
    <button type="button" onClick={() => onEdit(section)} aria-label={`Sửa ${label}`}
      className={cn(BTN_SECONDARY, BTN_SM, 'personal-preview-edit-link')}>
      <Pencil aria-hidden className="h-3.5 w-3.5" />Sửa
    </button>
  )
  const manage = onEdit && <Link to="/tuyen-dung/tin-dang" className={cn(LINK, 'inline-flex min-h-9 items-center gap-1 text-sm')}>
    Quản lý tin<ArrowUpRight aria-hidden className="h-4 w-4" />
  </Link>

  return <>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <Card title="Giới thiệu doanh nghiệp" icon={Building2} className="personal-preview-about" action={edit('about', 'giới thiệu doanh nghiệp')}>
        {company.tagline?.trim() && <p className="mt-4 whitespace-pre-line text-sm font-medium leading-6 [overflow-wrap:anywhere]">{company.tagline}</p>}
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-page-muted [overflow-wrap:anywhere]">{company.about?.trim() || 'Chưa cập nhật'}</p>
        <dl className="mt-6 space-y-4 [&_dd]:min-w-0 [&_dd]:[overflow-wrap:anywhere] [&_dt]:shrink-0">
          <Detail icon={BriefcaseBusiness} label="Lĩnh vực" value={company.industry?.trim() || undefined} />
          <Detail icon={Users} label="Quy mô" value={size || undefined} />
          <Detail icon={CalendarDays} label="Năm thành lập" value={company.foundedYear ? String(company.foundedYear) : undefined} />
        </dl>
      </Card>
      <Card title="Thông tin tuyển dụng" icon={Target} action={manage}>
        <dl className="mt-5 space-y-4 [&_dd]:min-w-0 [&_dd]:[overflow-wrap:anywhere] [&_dt]:shrink-0">
          <Detail icon={BriefcaseBusiness} label="Hình thức" value={jobTypes.join(', ') || undefined} />
          <Detail icon={Clock3} label="Ca tuyển dụng" value={facts.shifts.join(', ') || undefined} />
          <Detail icon={MapPin} label="Khu vực tuyển" value={facts.districts.join(', ') || undefined} />
        </dl>
      </Card>
    </div>

    <div className="grid min-w-0 gap-4">
      <Card title="Văn hóa" icon={Sparkles} className="personal-preview-row" action={edit('culture', 'văn hóa')}>
        <div className="min-w-0 space-y-5">
          <p className="whitespace-pre-line text-sm leading-7 text-page-muted [overflow-wrap:anywhere]">{company.culture?.trim() || 'Chưa cập nhật'}</p>
          <div><h3 className="mb-2 text-sm font-semibold">Giá trị cốt lõi</h3><ProfileList items={company.values} /></div>
          <div><h3 className="mb-2 text-sm font-semibold">Môi trường làm việc</h3><ProfileList items={company.environment} /></div>
        </div>
      </Card>
      <Card title="Địa điểm làm việc" icon={MapPin} className="personal-preview-row" action={edit('location', 'địa điểm làm việc')}>
        <div className="min-w-0">
          {address || district ? <div className="personal-preview-timeline">
            {address && <p className="whitespace-pre-line text-sm leading-6 [overflow-wrap:anywhere]">{address}</p>}
            {district && <p className={cn('text-sm leading-6 text-page-muted [overflow-wrap:anywhere]', address && 'mt-1')}>{district}, Đà Nẵng</p>}
          </div> : <p className="text-sm text-page-muted">Chưa cập nhật</p>}
        </div>
      </Card>
      <div id="viec-dang-tuyen" className="scroll-mt-28">
        <Card title={`Vị trí đang tuyển (${jobs.length})`} icon={BriefcaseBusiness} className="personal-preview-row" action={manage}>
          <div className="min-w-0 [&_a]:min-w-0 [&_a]:max-w-full [&_a]:[overflow-wrap:anywhere]">
            {onEdit ? <>
              {jobs.length ? <ul className="space-y-5">
                {jobs.map((job) => <li key={job.id} className="personal-preview-timeline">
                  <Link to={`/dang-tin?sua=${encodeURIComponent(job.id)}`} className={cn(LINK, 'inline-flex min-h-9 items-center gap-2 text-sm font-semibold [overflow-wrap:anywhere]')}>
                    {job.title}<Pencil aria-hidden className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                  <p className="mt-1 text-sm leading-6 text-page-muted [overflow-wrap:anywhere]">{[job.salaryLabel, job.shiftLabel, job.district].filter(Boolean).join(' · ')}</p>
                </li>)}
              </ul> : <p className="text-sm text-page-muted">Hiện chưa có tin đang mở.</p>}
              <Link to="/dang-tin" className={cn(LINK, 'mt-4 inline-flex min-h-9 items-center gap-1.5 text-sm')}>Đăng tin tuyển dụng<ArrowUpRight aria-hidden className="h-4 w-4" /></Link>
            </> : <>
              <JobLinks jobs={jobs} />
              {!jobs.length && <Link to="/viec-lam" className={cn(LINK, 'mt-4 inline-flex min-h-10 items-center text-sm')}>Tìm việc tại công ty khác</Link>}
            </>}
          </div>
        </Card>
      </div>
      <Card title="Phúc lợi" icon={Gift} className="personal-preview-row" action={edit('benefits', 'phúc lợi')}>
        <div className="min-w-0"><ProfileList items={company.policies} /></div>
      </Card>
    </div>
  </>
}
