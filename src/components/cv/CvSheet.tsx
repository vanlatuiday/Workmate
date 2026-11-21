import { Briefcase as BriefcaseIcon, CalendarDays, Clock, Mail, MapPin, Phone, Target as TargetIcon, User, type LucideIcon } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'
import avatarDefault from '@assets/images/avatar-default.webp'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { startLabel } from '@utils/format'
import type { JobType } from '@/types'

/** Dữ liệu CV — tách khỏi SeekerProfile để trang khác (vd. hồ sơ ứng viên) cũng dựng được. */
export interface CvData {
  fullName: string
  headline: string
  avatarUrl: string | null
  /** Có hiện ảnh không (mặc định có) */
  showAvatar?: boolean
  phone: string
  email?: string
  area: string
  birthDate: string | null
  gender: 'nam' | 'nu' | 'khac' | null
  showPersonal: boolean
  intro: string
  about: string
  skills: string[]
  skillLevels: Record<string, number>
  hobbies: string[]
  experience: { id: string; title: string; company: string; period: string; bullets: string[] }[]
  availability: string[]
  availableFrom: string | null
  salaryMin: number
  maxDistanceKm: number
  jobTypes: JobType[]
}

export type CvMode = 'owner' | 'recruiter'

const GENDER_LABEL = { nam: 'Nam', nu: 'Nữ', khac: 'Khác' } as const

const fmtBirth = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

/** Hàng liên hệ ở cột trái: huy hiệu tròn + chữ */
function ContactRow({ icon: Icon, children, muted }: { icon: LucideIcon; children: ReactNode; muted?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wm-ivory text-wm-abyss">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className={`min-w-0 break-words text-[13px] leading-snug ${muted ? 'text-wm-ivory/80' : 'text-wm-ivory'}`}>{children}</span>
    </li>
  )
}

/** Tiêu đề phần ở cột phải: huy hiệu tròn abyss + chữ đậm */
function RightHead({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wm-abyss text-wm-ivory">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h3 className="font-display text-[19px] font-semibold text-wm-abyss">{title}</h3>
    </div>
  )
}

/** Gợi ý ở chế độ chủ hồ sơ khi phần còn trống (không hiện ở bản nhà tuyển dụng, không in) */
const Hint = ({ children }: { children: ReactNode }) => (
  <p className="mt-2 text-[12px] italic text-wm-abyss/70 print:hidden">{children}</p>
)

/**
 * Tờ CV khổ A4 (210×297mm) dựng từ hồ sơ, cập nhật theo từng phím gõ.
 * Bố cục cố định theo mm/px — nơi dùng tự thu nhỏ bằng transform (xem CvPanel); in bằng window.print() với @page A4.
 * `owner` = có SĐT/email; `recruiter` = bản nhà tuyển dụng thấy (liên hệ khóa tới khi kết nối, ngày sinh/giới tính theo `showPersonal`).
 */
const CvSheet = forwardRef<HTMLDivElement, { data: CvData; mode: CvMode; /** Bản thu nhỏ cạnh form: ảnh đại diện nhỏ hơn cho cân */ compact?: boolean }>(function CvSheet({ data, mode, compact }, ref) {
  const owner = mode === 'owner'
  const name = data.fullName.trim()
  const goal = (data.about.trim() || data.intro.trim())
  const exps = data.experience.filter((e) => e.title.trim() || e.company.trim() || e.bullets.some((b) => b.trim()))
  const showPersonal = owner || data.showPersonal
  const jobTypes = JOB_TYPES.filter((t) => data.jobTypes.includes(t.value)).map((t) => t.label)
  const days = DAY_SHORT.map((d, di) => ({ d, ses: SESSIONS.filter((_, si) => data.availability.includes(`${di}-${si}`)) })).filter((x) => x.ses.length)
  const photo = data.avatarUrl && data.showAvatar !== false
  const ava = compact ? 'h-[104px] w-[104px]' : 'h-[150px] w-[150px]'

  return (
    <div
      ref={ref}
      data-cv-sheet
      className="grid h-auto min-h-[297mm] w-[210mm] grid-cols-[72mm_minmax(0,1fr)] bg-white font-sans text-wm-abyss"
    >
      {/* Cột trái: nửa trên pha ocean + abyss, nửa dưới abyss */}
      <div className="flex flex-col bg-wm-abyss text-wm-ivory">
        <div className="flex flex-col items-center bg-[color-mix(in_srgb,var(--wm-ocean)_45%,var(--wm-abyss))] px-6 pb-7 pt-8 text-center">
          {photo ? (
            <img src={data.avatarUrl!} alt="" className={`${ava} rounded-full border-4 border-wm-ivory object-cover`} />
          ) : (
            // Không có ảnh (hoặc tắt hiện ảnh): ảnh đại diện mặc định, giống thẻ ứng viên ở trang Kết nối
            <img src={avatarDefault} alt="" className={`${ava} rounded-full border-4 border-wm-ivory bg-wm-ivory object-cover`} />
          )}
          <h2 className="mt-5 break-words font-display text-[30px] font-semibold leading-tight text-wm-ivory">{name || (owner ? 'Họ và tên' : 'Chưa có tên')}</h2>
          {data.headline.trim() ? (
            <p className="mt-2 break-words font-display text-[17px] text-wm-ivory/90">{data.headline.trim()}</p>
          ) : (
            owner && <p className="mt-2 text-[13px] text-wm-ivory/70 print:hidden">Thêm chức danh</p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-6 px-6 py-6">
          <ul className="space-y-2.5" aria-label="Liên hệ">
            {owner ? (
              <>
                {data.phone.trim() && <ContactRow icon={Phone}>{data.phone}</ContactRow>}
                {data.email && <ContactRow icon={Mail}>{data.email}</ContactRow>}
              </>
            ) : (
              <>
                <ContactRow icon={Phone} muted>Mở sau khi kết nối</ContactRow>
                <ContactRow icon={Mail} muted>Mở sau khi kết nối</ContactRow>
              </>
            )}
            {data.area.trim() && <ContactRow icon={MapPin}>{data.area}</ContactRow>}
            {showPersonal && data.birthDate && <ContactRow icon={CalendarDays}>{fmtBirth(data.birthDate)}</ContactRow>}
            {showPersonal && data.gender && <ContactRow icon={User}>{GENDER_LABEL[data.gender]}</ContactRow>}
          </ul>

          {goal ? (
            <section>
              <h3 className="font-display text-[19px] font-semibold text-wm-ivory">Mục tiêu nghề nghiệp</h3>
              <p className="mt-2 whitespace-pre-line break-words text-[13px] leading-relaxed text-wm-ivory/95">{goal}</p>
            </section>
          ) : owner && (
            <section>
              <h3 className="font-display text-[19px] font-semibold text-wm-ivory">Mục tiêu nghề nghiệp</h3>
              <p className="mt-2 text-[12px] italic text-wm-ivory/70 print:hidden">Viết vài dòng giới thiệu để CV có mục tiêu nghề nghiệp.</p>
            </section>
          )}

          {data.skills.length > 0 && (
            <section>
              <h3 className="font-display text-[19px] font-semibold text-wm-ivory">Kỹ năng</h3>
              <ul className="mt-3 space-y-3">
                {data.skills.map((s) => {
                  const lv = data.skillLevels[s] ?? 0
                  return (
                    <li key={s}>
                      <p className="break-words text-[13px] text-wm-ivory">{s}</p>
                      {lv > 0 && (
                        <div className="mt-1.5 h-1.5 rounded-full bg-wm-ivory/25" role="img" aria-label={`Mức ${lv} trên 5`}>
                          <div className="h-full rounded-full bg-wm-ivory" style={{ width: `${(Math.min(5, lv) / 5) * 100}%` }} />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {data.hobbies.length > 0 && (
            <section>
              <h3 className="font-display text-[19px] font-semibold text-wm-ivory">Sở thích</h3>
              <ul className="mt-2 space-y-1.5">
                {data.hobbies.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 break-words text-[13px] text-wm-ivory">
                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-wm-ivory" />{h}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Cột phải: nền trắng */}
      <div className="space-y-6 bg-white px-7 py-8">
        {(exps.length > 0 || owner) && (
        <section>
            <RightHead icon={BriefcaseIcon} title="Kinh nghiệm làm việc" />
            {exps.length ? (
              <ul className="mt-3 space-y-4">
                {exps.map((e) => (
                  <li key={e.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="min-w-0 break-words text-[14px] font-bold">{e.title || 'Chưa đặt tên'}</h4>
                      {e.period && <span className="shrink-0 text-[13px]">{e.period}</span>}
                    </div>
                    {e.company && <p className="mt-0.5 break-words text-[13px] font-bold">{e.company}</p>}
                    {e.bullets.some((b) => b.trim()) && (
                      <ul className="mt-1.5 space-y-1">
                        {e.bullets.filter((b) => b.trim()).map((b, i) => (
                          <li key={i} className="flex items-start gap-2 break-words text-[13px] leading-snug">
                            <span aria-hidden className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-wm-abyss" />{b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : owner ? <Hint>Thêm kinh nghiệm để CV đầy đủ hơn.</Hint> : null}
          </section>
        )}

        {(days.length > 0 || owner) && (
          <section>
            <RightHead icon={Clock} title="Lịch rảnh" />
            {days.length ? (
              <>
                <p className="mt-2 text-[12px]">Có thể bắt đầu {startLabel(data.availableFrom)}</p>
                {/* Bảng lịch rảnh: hàng = buổi, cột = ngày; ô rảnh tô abyss có dấu ✓ (in màu được nhờ print-color-adjust) */}
                <table className="mt-2 w-full table-fixed border-collapse text-center text-[11px]">
                  <caption className="sr-only">Lịch rảnh trong tuần ({data.availability.length} buổi)</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="w-[52px]" />
                      {DAY_SHORT.map((d) => (
                        <th key={d} scope="col" className="pb-1 font-bold">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SESSIONS.map((ses, si) => (
                      <tr key={ses}>
                        <th scope="row" className="pr-1.5 text-left font-semibold">{ses}</th>
                        {DAY_SHORT.map((d, di) => {
                          const on = data.availability.includes(`${di}-${si}`)
                          return (
                            <td key={d} className="p-[2px]">
                              <span
                                className={`flex h-[18px] items-center justify-center rounded-[4px] border ${on ? 'border-wm-abyss bg-wm-abyss text-wm-ivory' : 'border-wm-abyss/15 bg-wm-abyss/[0.03]'}`}
                              >
                                {on ? <span aria-hidden>✓</span> : null}
                                <span className="sr-only">{on ? 'Rảnh' : 'Bận'}</span>
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : <Hint>Chọn ca rảnh để nhà tuyển dụng biết khi nào bạn đi làm được.</Hint>}
          </section>
        )}

        <section>
          <RightHead icon={TargetIcon} title="Mong muốn" />
          <p className="mt-2 text-[13px] leading-snug">
            Lương từ {data.salaryMin.toLocaleString('vi-VN')}đ/giờ · trong {data.maxDistanceKm} km
            {jobTypes.length ? ` · ${jobTypes.join(', ')}` : ''}
          </p>
        </section>
      </div>
    </div>
  )
})

export default CvSheet
