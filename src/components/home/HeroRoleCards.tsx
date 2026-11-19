import { Check } from 'lucide-react'

import { heroPreview } from './content'
import { LIGHT_CARD_VARS } from './homeBackground'

const CARD =
  `${LIGHT_CARD_VARS} h-full overflow-hidden rounded-card border border-wm-ivory/70 bg-wm-ivory/75 p-4 text-left text-page-fg ` +
  'shadow-[0_14px_32px_-20px_var(--wm-night)] backdrop-blur-xl backdrop-saturate-150'

const PILL = 'rounded-full bg-wm-azure/15 text-wm-ocean font-semibold'

/** Nhãn nhỏ phía trên mỗi thẻ: chấm + tên vai trò. */
function Label({ children }: { children: string }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-wm-ivory">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-wm-ivory" />
      {children}
    </p>
  )
}

/**
 * Ba thẻ xem trước theo vai trò, nằm trọn ở đáy hero; từng thẻ (data-hero-card) nổi lên lần lượt.
 * Ba thẻ chĩa ba hướng (trái nghiêng trái, giữa thẳng, phải nghiêng phải — .hero-card-tilt, index.css),
 * trôi lơ lửng nhẹ; rê chuột vào thẻ thì thẻ xoay thẳng lại và nhấc lên.
 * Chỉ là minh họa tĩnh (không bấm được); chỉ hiện từ lg trở lên.
 * Phần tử ngoài cùng mang data-hero-item để timeline intro cho hiện cùng nội dung.
 */
export default function HeroRoleCards() {
  const { jobseeker, recruiter, admin, note } = heroPreview

  return (
    <div data-hero-item className="relative shell w-full">
      <p className="absolute -top-5 right-0 text-[11px] text-wm-ivory/80">{note}</p>
      <ul aria-label="Xem trước theo vai trò" className="grid grid-cols-3 gap-4 [perspective:1400px] lg:gap-6">
        <li data-hero-card>
          <div className="hero-card-tilt hero-card-tilt--left">
          <Label>{jobseeker.label}</Label>
          <div className={CARD}>
            <h3 className="text-sm font-semibold">{jobseeker.title}</h3>
            <ul className="mt-3 space-y-3">
              {jobseeker.rows.map((r) => (
                <li key={r.title} className="flex items-center gap-3">
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-page-surface text-sm font-semibold">
                    {r.initial}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    <span className="block truncate text-xs text-page-muted">
                      {r.company} · {r.district}
                    </span>
                  </span>
                  <span className={`${PILL} px-2 py-0.5 text-xs`}>{r.fit}%</span>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </li>

        {/* Thẻ giữa nâng nhẹ để có nhịp (margin, vì transform do GSAP điều khiển) */}
        <li data-hero-card className="-mt-3">
          <div className="hero-card-tilt hero-card-tilt--mid">
          <Label>{recruiter.label}</Label>
          <div className={CARD}>
            <h3 className="text-sm font-semibold">{recruiter.title}</h3>
            <div className="mt-3 flex items-center gap-3">
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-page-surface text-sm font-semibold">
                {recruiter.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{recruiter.name}</span>
                <span className="block truncate text-xs text-page-muted">{recruiter.role}</span>
              </span>
            </div>
            <ul aria-label="Kỹ năng" className="mt-3 flex flex-wrap gap-1.5">
              {recruiter.skills.map((s) => (
                <li key={s} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs">
                  {s}
                </li>
              ))}
            </ul>
            <ul aria-label="Lịch rảnh trong tuần" className="mt-3 grid grid-cols-7 gap-1">
              {recruiter.week.map((d) => (
                <li
                  key={d.day}
                  className={`rounded-control py-1 text-center text-[11px] font-medium ${
                    d.free ? 'bg-wm-azure/15 text-wm-ocean' : 'bg-page-surface text-page-muted'
                  }`}
                >
                  {d.day}
                  <span className="sr-only">{d.free ? ' rảnh' : ' bận'}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium">Phù hợp {recruiter.fit}%</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-page-surface">
                <div className="h-full rounded-full bg-wm-ocean" style={{ width: `${recruiter.fit}%` }} />
              </div>
            </div>
          </div>
          </div>
        </li>

        <li data-hero-card>
          <div className="hero-card-tilt hero-card-tilt--right">
          <Label>{admin.label}</Label>
          <div className={CARD}>
            <h3 className="text-sm font-semibold">{admin.title}</h3>
            <ul className="mt-3 space-y-3">
              {admin.rows.map((name) => (
                <li key={name} className="flex items-center gap-3">
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-page-surface text-sm font-semibold">
                    {name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                  <span className={`${PILL} inline-flex items-center gap-1 px-2 py-0.5 text-xs`}>
                    <Check className="h-3 w-3" aria-hidden />
                    Đã xác minh
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-page-line pt-2 text-xs text-page-muted">
              {admin.footer} · {admin.count}
            </p>
          </div>
          </div>
        </li>
      </ul>
    </div>
  )
}
