import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import Avatar from './Avatar'
import { fmtMoney, type ProfileApi } from './useProfileDraft'

const chipCls = 'rounded-full border border-page-edge px-3 py-1 text-xs text-page-fg'

/** Thẻ xem trước: hồ sơ như doanh nghiệp thấy, cập nhật theo từng phím gõ (không có SĐT/email). */
export default function ProfilePreview({ api }: { api: ProfileApi }) {
  const { profile, percent } = api
  const jobTypes = JOB_TYPES.filter((t) => profile.jobTypes.includes(t.value)).map((t) => t.label)
  return (
    <div data-lenis-prevent className="rounded-card border border-page-line bg-page-surface p-5 lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto">
      <p className="text-xs uppercase tracking-widest text-page-muted">Nhà tuyển dụng sẽ thấy</p>
      <div className="mt-4 flex items-center gap-4">
        <Avatar name={profile.fullName} url={profile.avatarUrl} show={profile.showAvatar} className="h-16 w-16 text-xl" />
        <div className="min-w-0">
          <h2 className="break-words font-display text-xl font-semibold text-page-fg">{profile.fullName.trim() || 'Chưa có tên'}</h2>
          <p className="text-sm text-page-muted">{[profile.area, profile.published ? 'Đã công khai' : 'Chưa công khai'].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-page-fg">{profile.intro.trim() || <span className="text-page-muted">Chưa có giới thiệu.</span>}</p>

      <h3 className="mt-5 text-xs font-medium text-page-muted">Kỹ năng</h3>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {profile.skills.map((s) => <li key={s} className={chipCls}>{s}</li>)}
        {!profile.skills.length && <li className="text-sm text-page-muted">Chưa có.</li>}
      </ul>

      <h3 className="mt-5 text-xs font-medium text-page-muted">Lịch rảnh ({profile.availability.length} ca/tuần)</h3>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {DAY_SHORT.map((d, di) => {
          const ses = SESSIONS.filter((_, si) => profile.availability.includes(`${di}-${si}`))
          return ses.length ? <li key={d} className={chipCls}>{d}: {ses.join(', ')}</li> : null
        })}
        {!profile.availability.length && <li className="text-sm text-page-muted">Chưa chọn ca.</li>}
      </ul>

      <h3 className="mt-5 text-xs font-medium text-page-muted">Kinh nghiệm</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {profile.experience.filter((e) => e.title.trim() || e.company.trim()).map((e) => (
          <li key={e.id} className="break-words"><span className="font-medium text-page-fg">{e.title || 'Chưa đặt tên'}</span><span className="text-page-muted"> — {[e.company, e.period].filter(Boolean).join(', ')}</span></li>
        ))}
        {!profile.experience.some((e) => e.title.trim() || e.company.trim()) && <li className="text-page-muted">Chưa có.</li>}
      </ul>

      <h3 className="mt-5 text-xs font-medium text-page-muted">Mong muốn</h3>
      <p className="mt-2 text-sm text-page-fg">
        Từ {fmtMoney(profile.salaryMin)}/giờ · trong {profile.maxDistanceKm} km · {jobTypes.join(', ') || 'chưa chọn loại việc'}
      </p>

      {profile.about.trim() && (
        <>
          <h3 className="mt-5 text-xs font-medium text-page-muted">Về bạn</h3>
          <p className="mt-2 line-clamp-4 whitespace-pre-line break-words text-sm leading-relaxed text-page-fg">{profile.about}</p>
        </>
      )}
      <p className="mt-5 text-xs text-page-muted">Hồ sơ hoàn thiện {percent}% · liên hệ chỉ mở sau khi hai bên kết nối.</p>
    </div>
  )
}
