// Ô "Mức độ phù hợp" — chỉ ở chế độ người xem đối phương. Điểm tính thật từ logic.ts.
import { Check, Minus, X } from 'lucide-react'
import { cn } from '@utils/cn'
import type { CellDef } from './context'
import type { CompanyProfile, ProfileKind, SeekerProfile } from './model'
import { matchCompany, type CriterionResult, type PositionMatch } from './logic'
import { Badge } from './ui'

function Criterion({ c }: { c: CriterionResult }) {
  const Icon = c.ok === null ? Minus : c.ok ? Check : X
  const sr = c.ok === null ? 'Chưa đủ dữ liệu' : c.ok ? 'Đạt' : 'Chưa đạt'
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">{sr}: </span>
      {c.text}
    </li>
  )
}

function Score({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div role="img" aria-label={`${value}%`} className="h-1.5 w-24 overflow-hidden rounded-full bg-page-line">
        <div className="h-full origin-left rounded-full bg-page-fg" style={{ transform: `scaleX(${value / 100})` }} />
      </div>
      <span className="font-display text-lg font-semibold">{value}%</span>
    </div>
  )
}

/** `kind` = loại hồ sơ đang hiển thị (company → người xem là ứng viên; seeker → người xem là doanh nghiệp) */
function Detail({ matches, kind, company }: { matches: PositionMatch[]; kind: ProfileKind; company: CompanyProfile }) {
  if (!matches.length) return <p className="text-sm text-page-muted">Công ty chưa có vị trí nào để so sánh.</p>
  return (
    <div className="space-y-6">
      <p className="text-sm text-page-muted">
        {kind === 'seeker'
          ? 'Ứng viên này khớp với từng vị trí đang tuyển của bạn như sau.'
          : `Hồ sơ của bạn so với các vị trí tại ${company.name}.`}
      </p>
      <ul className="space-y-6">
        {matches.map((m, i) => (
          <li key={m.position.id} className={cn('space-y-3', i > 0 && 'border-t border-page-line pt-6')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-medium">{m.position.title}</h3>
              <div className="flex items-center gap-3">
                {i === 0 && m.score > 0 && <Badge>Phù hợp nhất</Badge>}
                <Score value={m.score} />
              </div>
            </div>
            {kind === 'seeker' && (
              <p className="text-sm text-page-muted">
                Kỹ năng khớp: {m.matchedSkills.join(', ') || 'chưa có'}. Còn thiếu: {m.missingSkills.join(', ') || 'không'}.
              </p>
            )}
            <ul className="space-y-1.5">
              {m.criteria.map((c) => (
                <Criterion key={c.key} c={c} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Ứng viên xem doanh nghiệp: so hồ sơ của mình với các vị trí.
 * Doanh nghiệp xem ứng viên: lương chỉ tính khi ứng viên đang để hiện.
 */
export function matchCell(kind: ProfileKind, seeker: SeekerProfile, company: CompanyProfile): CellDef {
  const matches = matchCompany(seeker, company, kind === 'company' ? true : seeker.visibility.salary)
  const top = matches[0]
  const lead = kind === 'company' ? 'Vị trí hợp với bạn nhất' : 'Ứng viên khớp nhất với vị trí'
  return {
    id: 'match',
    slot: 'M',
    label: 'Mức độ phù hợp',
    summary: top ? (
      <div className="space-y-2">
        <p className="text-sm text-page-muted">{lead}</p>
        <p className="text-sm font-medium">{top.position.title}</p>
        <Score value={top.score} />
        <p className="text-sm text-page-muted">
          {matches.length > 1 ? `và ${matches.length - 1} vị trí khác` : 'Chỉ có 1 vị trí'}
        </p>
      </div>
    ) : (
      <p className="text-sm text-page-muted">Chưa có vị trí nào để so sánh.</p>
    ),
    detail: <Detail matches={matches} kind={kind} company={company} />,
  }
}
