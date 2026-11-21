import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BriefcaseBusiness, Building2, CalendarDays, Clock3, MapPin, Sparkles, Star, Target, UserRound } from 'lucide-react'
import { Stars } from '@components/hire/ReviewList'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { useAuthStore } from '@context/authStore'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'
import { Card, Detail } from './personalPrototypeParts'
import { seekerWorkHistory } from './seekerWorkHistory'
import { useSeekerOverview } from './useSeekerOverview'

const date = (value: string) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
const score = (value: number) => value.toFixed(1).replace('.', ',')

export default function SeekerProfileSections() {
  const userId = useAuthStore((s) => s.user?.id)
  const { active, data, error, retry } = useSeekerOverview()
  const [allReviews, setAllReviews] = useState(false)

  if (!active) return (
    <Card title="Hành trình làm việc của bạn" icon={BriefcaseBusiness} className="lg:col-span-2">
      <p className="mt-4 text-sm leading-7 text-page-muted">Đăng nhập bằng tài khoản người tìm việc để xem các công ty đã xác nhận nhận việc, đánh giá từ doanh nghiệp và hồ sơ của bạn.</p>
      <Link to="/dang-nhap" state={{ from: '/ca-nhan' }} className={cn(BTN_SECONDARY, BTN_SM, 'mt-4')}>Đăng nhập</Link>
    </Card>
  )
  if (!data) return (
    <div className="personal-preview-card rounded-card lg:col-span-2" role={error ? 'alert' : 'status'}>
      <p className="text-sm text-page-muted">{error ? 'Chưa tải được hồ sơ làm việc. Bạn có thể thử lại.' : 'Đang tải hồ sơ làm việc…'}</p>
      {error && <button type="button" className={cn(BTN_SECONDARY, BTN_SM, 'mt-4')} onClick={retry}>Thử lại</button>}
    </div>
  )

  const { profile, reviews } = data
  const { history, companyCount, missingCompany, average, strengths } = seekerWorkHistory(userId!, data.hires, data.jobs, data.companies, reviews)
  const latestReviews = [...reviews].sort((a, b) => b.at.localeCompare(a.at))
  const schedule = DAY_SHORT.map((day, di) => ({ day, sessions: SESSIONS.filter((_, si) => profile.availability.includes(`${di}-${si}`)) })).filter((d) => d.sessions.length)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

  return <>
    <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <Card title="Tóm tắt làm việc" icon={BriefcaseBusiness}>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          {[{ value: missingCompany ? '—' : companyCount, label: 'Công ty đã xác nhận nhận việc' }, { value: history.length, label: 'Việc đã xác nhận nhận' }].map((stat) => (
            <div key={stat.label} className="rounded-control bg-wm-azure/5 p-3">
              <dd className="font-display text-3xl font-semibold text-wm-ocean">{stat.value}</dd>
              <dt className="mt-2 text-xs leading-5 text-page-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-5 border-t border-page-line pt-4">
          {average === null ? <p className="text-sm text-page-muted">Chưa có đánh giá từ doanh nghiệp</p> : <>
            <p className="flex flex-wrap items-center gap-2"><strong className="text-2xl text-wm-ocean">{score(average)}<span className="text-sm font-normal">/5</span></strong><Stars value={average} /></p>
            <p className="mt-2 text-xs text-page-muted">Trung bình từ {reviews.length} đánh giá của doanh nghiệp</p>
          </>}
        </div>
        <p className="mt-4 text-xs leading-5 text-page-muted">Dựa trên xác nhận nhận việc trên Workmate; chưa có dữ liệu xác nhận hoàn thành ca.</p>
      </Card>
      <Card title="Sẵn sàng nhận việc" icon={Target}>
        <dl className="mt-5 space-y-4">
          <Detail icon={MapPin} label="Khu vực" value={profile.area || 'Chưa cập nhật'} />
          <Detail icon={BriefcaseBusiness} label="Hình thức" value={JOB_TYPES.filter((t) => profile.jobTypes.includes(t.value)).map((t) => t.label).join(', ') || 'Chưa chọn'} />
          <Detail icon={CalendarDays} label="Có thể bắt đầu" value={profile.availableFrom ? date(profile.availableFrom) : 'Có thể bắt đầu ngay'} />
          <Detail icon={Target} label="Lương mong muốn" value={profile.salaryMinK > 0 ? `Từ ${(profile.salaryMinK * 1000).toLocaleString('vi-VN')} đ/giờ` : 'Chưa cập nhật'} />
        </dl>
        <div className="mt-5 border-t border-page-line pt-4">
          <h3 className="flex items-center gap-2 text-sm font-medium"><Clock3 aria-hidden className="h-4 w-4 text-wm-ocean" />Lịch rảnh trong tuần</h3>
          {schedule.length ? <ul className="mt-3 space-y-2 text-xs text-page-muted">{schedule.map(({ day, sessions }) => <li key={day} className="flex gap-3"><span className="w-6 shrink-0 font-semibold">{day}</span><span>{sessions.join(', ')}</span></li>)}</ul> : <p className="mt-3 text-sm text-page-muted">Chưa chọn lịch rảnh.</p>}
        </div>
      </Card>
    </div>
    <div className="grid gap-4">
      <Card title="Công ty và lịch sử nhận việc" icon={Building2}>
        <p className="mt-2 text-xs leading-5 text-page-muted">Các vị trí bạn đã xác nhận nhận việc qua Workmate.</p>
        {history.length ? <ul className="mt-5 space-y-5">{history.map(({ hire, job, company, review }) => <li key={hire.jobId} className="personal-preview-timeline break-words">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{company?.name || 'Chưa tải được tên công ty'}</h3>
            <span className="personal-preview-chip">{hire.startDate && hire.startDate > today ? 'Sắp bắt đầu' : 'Đã xác nhận nhận việc'}</span>
          </div>
          <p className="mt-1 text-sm">{job?.title || 'Chưa tải được tên vị trí'}</p>
          <p className="mt-2 text-xs leading-5 text-page-muted">{hire.startDate ? `Ngày bắt đầu theo lời mời: ${date(hire.startDate)}` : 'Chưa có ngày bắt đầu'} · Xác nhận ngày {date(hire.updatedAt)}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-page-muted">{review ? <><Stars value={review.stars} /><span>{review.stars}/5 từ doanh nghiệp</span></> : 'Chưa có đánh giá cho vị trí này'}</p>
        </li>)}</ul> : <p className="mt-4 text-sm leading-6 text-page-muted">Chưa có việc đã xác nhận nhận trên Workmate. Lịch sử sẽ xuất hiện khi bạn xác nhận lời mời nhận việc.</p>}
      </Card>
      <Card title="Đánh giá từ doanh nghiệp" icon={Star}>
        {latestReviews.length ? <>
          <ul className="mt-2 divide-y divide-page-line">{latestReviews.slice(0, allReviews ? undefined : 4).map((review) => <li key={review.jobId} className="py-4 break-words">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{review.authorName}</h3><time className="text-xs text-page-muted" dateTime={review.at}>{date(review.at)}</time></div>
            <p className="mt-2 flex items-center gap-2"><Stars value={review.stars} /><span className="text-xs text-page-muted">{review.stars}/5</span></p>
            {!!review.tags.length && <ul className="mt-3 flex flex-wrap gap-2">{review.tags.map((tag) => <li key={tag} className="personal-preview-chip">{tag}</li>)}</ul>}
            {review.comment && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-page-muted">{review.comment}</p>}
          </li>)}</ul>
          {latestReviews.length > 4 && <button type="button" className={cn(BTN_SECONDARY, BTN_SM, 'mt-2')} aria-expanded={allReviews} onClick={() => setAllReviews(!allReviews)}>{allReviews ? 'Thu gọn đánh giá' : `Đọc đủ ${latestReviews.length} đánh giá`}</button>}
        </> : <p className="mt-4 text-sm leading-6 text-page-muted">Bạn chưa nhận được đánh giá từ doanh nghiệp. Điểm sao và nhận xét sẽ xuất hiện khi doanh nghiệp gửi đánh giá.</p>}
      </Card>
      <Card title="Kỹ năng và điểm mạnh" icon={Sparkles}>
        <h3 className="mt-4 text-xs font-medium text-page-muted">Kỹ năng trong hồ sơ</h3>
        {profile.skills.length ? <ul className="mt-3 flex flex-wrap gap-2">{profile.skills.map((skill) => <li key={skill} className="personal-preview-chip max-w-full break-words">{skill}</li>)}</ul> : <p className="mt-2 text-sm text-page-muted">Chưa thêm kỹ năng.</p>}
        <h3 className="mt-5 text-xs font-medium text-page-muted">Điểm mạnh được doanh nghiệp ghi nhận</h3>
        {strengths.length ? <ul className="mt-3 flex flex-wrap gap-2">{strengths.map((tag) => <li key={tag} className="personal-preview-chip max-w-full break-words">{tag}</li>)}</ul> : <p className="mt-2 text-sm text-page-muted">Chưa có điểm mạnh từ đánh giá của doanh nghiệp.</p>}
      </Card>
      <Card title="Giới thiệu và kinh nghiệm tự khai" icon={UserRound}>
        <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-page-muted">{profile.about || profile.intro || 'Chưa thêm giới thiệu bản thân.'}</p>
        {!!profile.experience.length && <ul className="mt-5 space-y-5">{profile.experience.map((item) => <li key={item.id} className="personal-preview-timeline break-words"><h3 className="text-sm font-semibold">{item.title || 'Chưa thêm vị trí'}</h3><p className="mt-1 text-sm text-page-muted">{[item.company, item.period].filter(Boolean).join(' · ') || 'Chưa thêm nơi làm và thời gian'}</p>{!!item.bullets.length && <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6 text-page-muted">{item.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}</li>)}</ul>}
        <p className="mt-4 text-xs leading-5 text-page-muted">Nội dung do bạn cung cấp trong hồ sơ, chưa được doanh nghiệp xác nhận.</p>
      </Card>
    </div>
  </>
}
