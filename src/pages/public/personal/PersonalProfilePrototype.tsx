import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Camera, Mail, MapPin, Pencil, Phone, UserRound } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useProfileStore } from '@context/profileStore'
import { useCompanyStore } from '@context/companyStore'
import { GateError, GateSkeleton } from '@components/common/OnboardingGate'
import AccountDeletion from '@components/settings/AccountDeletion'
import { photoUrl } from '@components/discover/types'
import { BTN_ICON, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'
import Avatar from '../profile/Avatar'
import cover from '@assets/images/personal-cover-preview.webp'
import backdrop from '@assets/images/page-bg-jobs-preview.webp'
import SeekerProfileSections from './SeekerProfileSections'
import RecruiterProfileSections from './RecruiterProfileSections'
import CoverEditor from './CoverEditor'
import CompanyProfileEditor from './CompanyProfileEditor'
import type { CompanyEditSection } from './companyProfilePresentation'
import './personalPrototype.css'

/** Khung cá nhân dùng chung; dữ liệu riêng của tài khoản đang đăng nhập. */
export default function PersonalProfilePrototype() {
  const user = useAuthStore((s) => s.user)
  const profile = useProfileStore((s) => s.profile)
  const avatar = useProfileStore((s) => s.avatarUrl)
  const coverUrl = useProfileStore((s) => s.coverOwnerId === user?.id ? s.coverUrl : null)
  const [coverEditor, setCoverEditor] = useState<string | null>(null)
  const company = useCompanyStore((s) => s.profile)
  const companyId = useCompanyStore((s) => s.id)
  const companyLoaded = useCompanyStore((s) => s.loaded)
  const companyLoadFailed = useCompanyStore((s) => s.loadFailed)
  const logo = useCompanyStore((s) => s.logoUrl)
  const [companyEditor, setCompanyEditor] = useState<{ companyId: string; section: CompanyEditSection } | null>(null)
  const owner = user?.role === 'jobseeker'
  const recruiter = user?.role === 'recruiter'
  const name = recruiter ? company.name || 'Tên doanh nghiệp' : owner ? profile.fullName || 'Tên của bạn' : 'Tên của bạn'
  const editHref = recruiter ? '/tuyen-dung/ho-so-cong-ty' : owner ? '/ho-so' : '/dang-nhap'
  const area = recruiter ? company.district ? `${company.district}, Đà Nẵng` : 'Địa điểm doanh nghiệp' : owner ? profile.area || 'Địa điểm của bạn' : 'Địa điểm của bạn'
  const email = recruiter ? company.email || 'Chưa thêm email liên hệ' : owner ? user.email : 'Email của bạn'
  const phone = recruiter ? company.phone || 'Chưa thêm số điện thoại' : owner ? profile.phone || 'Chưa thêm số điện thoại' : 'Số điện thoại của bạn'
  const editState = owner || recruiter ? undefined : { from: '/ho-so' }
  const companyCover = recruiter ? photoUrl(company.cover, 1800) : undefined
  const headerCover = recruiter ? companyCover || cover : owner && coverUrl ? coverUrl : cover
  const openCompanyEditor = (section: CompanyEditSection) => setCompanyEditor({ companyId, section })

  useEffect(() => {
    if (recruiter && !companyLoaded && !companyLoadFailed) void useCompanyStore.getState().load().catch(() => undefined)
  }, [recruiter, companyLoaded, companyLoadFailed])

  useEffect(() => {
    document.documentElement.dataset.personalPreview = ''
    return () => { delete document.documentElement.dataset.personalPreview }
  }, [])

  if (recruiter && (!companyLoaded || !companyId)) return companyLoadFailed ? <GateError /> : <GateSkeleton />

  return (
    <div className="personal-preview theme-day relative isolate min-h-[calc(100svh-72px)] overflow-hidden text-page-fg" data-surface="light">
      <div aria-hidden className="personal-preview-backdrop pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: `url(${backdrop})` }} />
      <div className="mx-auto max-w-[1328px] px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-7">
        <header className="personal-preview-cover relative overflow-hidden rounded-card">
          <img src={headerCover} alt="" width={1800} height={600} className={cn('absolute inset-0 h-full w-full object-cover', companyCover || (owner && coverUrl) ? 'object-center' : 'object-right')} decoding="async" />
          <div aria-hidden className="personal-preview-cover-veil absolute inset-0" />
          <div className="relative flex flex-col items-center gap-5 px-6 py-7 text-center sm:flex-row sm:px-8 sm:text-left lg:gap-7 lg:py-8">
            <div className="relative shrink-0">
              {recruiter ? (
                logo ? <img src={logo} alt="" className="personal-preview-avatar h-28 w-28 rounded-full object-contain p-3 lg:h-36 lg:w-36" />
                  : <span aria-hidden className="personal-preview-avatar flex h-28 w-28 items-center justify-center rounded-full lg:h-36 lg:w-36"><Building2 className="h-14 w-14 text-wm-ocean/70 lg:h-16 lg:w-16" strokeWidth={1.3} /></span>
              ) : owner ? (
                <Avatar name={name} url={avatar} className="personal-preview-avatar h-28 w-28 text-4xl lg:h-36 lg:w-36 lg:text-5xl" />
              ) : (
                <span aria-hidden className="personal-preview-avatar flex h-28 w-28 items-center justify-center rounded-full lg:h-36 lg:w-36"><UserRound className="h-14 w-14 text-wm-ocean/70 lg:h-16 lg:w-16" strokeWidth={1.3} /></span>
              )}
              <Link to={editHref} state={editState} aria-label={recruiter ? 'Chỉnh sửa logo doanh nghiệp' : 'Chỉnh sửa ảnh đại diện trong hồ sơ'} className={cn(BTN_ICON, 'personal-preview-edit absolute -bottom-0.5 right-0 h-10 w-10')}>
                <Pencil aria-hidden className="h-4 w-4" />
              </Link>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
                <h1 className="min-w-0 max-w-full break-words font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">{name}</h1>
                <span className="personal-preview-chip">{recruiter ? 'Nhà tuyển dụng' : 'Người tìm việc'}</span>
              </div>
              <p className="mt-3 inline-flex items-center gap-2 text-sm"><MapPin aria-hidden className="h-4 w-4 text-wm-ocean" />{area}</p>
              <div className="mt-3 flex flex-col items-center gap-x-6 gap-y-2 text-sm sm:flex-row sm:flex-wrap sm:items-start">
                <p className="flex min-w-0 items-center gap-2"><Mail aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" /><span className="[overflow-wrap:anywhere]">{email}</span></p>
                <p className="flex items-center gap-2"><Phone aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" />{phone}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap justify-center gap-2 self-center sm:flex-col sm:self-start">
              {recruiter ? <button type="button" onClick={() => openCompanyEditor('general')} className={cn(BTN_SECONDARY, BTN_SM, 'personal-preview-edit-link')}>
                <Pencil aria-hidden className="h-3.5 w-3.5" />Chỉnh sửa hồ sơ
              </button> : <Link to={editHref} state={editState} className={cn(BTN_SECONDARY, BTN_SM, 'personal-preview-edit-link')}>
                <Pencil aria-hidden className="h-3.5 w-3.5" />Chỉnh sửa hồ sơ
              </Link>}
              {recruiter && <button type="button" className={cn(BTN_SECONDARY, BTN_SM, 'personal-preview-edit-link')} onClick={() => openCompanyEditor('cover')}><Camera aria-hidden className="h-3.5 w-3.5" />Đổi ảnh bìa</button>}
              {owner && <button type="button" className={cn(BTN_SECONDARY, BTN_SM, 'personal-preview-edit-link')} onClick={() => setCoverEditor(user.id)}><Camera aria-hidden className="h-3.5 w-3.5" />Đổi ảnh bìa</button>}
            </div>
          </div>
        </header>

        <div className="personal-preview-grid mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.95fr)]">
          {recruiter ? <RecruiterProfileSections onEdit={openCompanyEditor} /> : <SeekerProfileSections key={user?.id ?? 'guest'} />}
        </div>
        {!recruiter && <p className="mt-5 text-center text-xs leading-relaxed text-page-muted">Thông tin hồ sơ, xác nhận nhận việc và đánh giá trên Workmate.</p>}
        {(owner || recruiter) && (
          <section aria-labelledby="personal-account-heading" className="mt-6 rounded-card border border-page-line bg-page-surface p-5">
            <h2 id="personal-account-heading" className="mb-2 font-display text-lg font-semibold">Tài khoản</h2>
            <AccountDeletion key={user.id} side={recruiter ? 'recruiter' : 'seeker'} />
          </section>
        )}
      </div>
      {owner && coverEditor === user.id && <CoverEditor key={user.id} currentUrl={coverUrl} onClose={() => setCoverEditor(null)} />}
      {recruiter && companyEditor?.companyId === companyId && <CompanyProfileEditor key={`${user.id}-${companyId}-${companyEditor.section}`} section={companyEditor.section} onClose={() => setCompanyEditor(null)} />}
    </div>
  )
}
