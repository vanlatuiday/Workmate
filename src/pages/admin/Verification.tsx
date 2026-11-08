import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Check, X } from 'lucide-react'
import { PageHeader, StatusBadge, EmptyState } from '@components/dashboard'
import { useCatalogStore, type CatalogCompany } from '@context/catalogStore'
import { setCompanyVerified } from '@services/adminService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const BTN_PRIMARY = `rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`
const BTN_SECONDARY = `rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`

type Tab = 'pending' | 'verified'
const TABS: { value: Tab; label: string; empty: string }[] = [
  { value: 'pending', label: 'Chưa xác minh', empty: 'Mọi công ty đều đã được xác minh.' },
  { value: 'verified', label: 'Đã xác minh', empty: 'Chưa có công ty nào được xác minh.' },
]

/** /admin/xac-minh — gắn hoặc bỏ nhãn đã xác minh cho công ty. Chưa có quy trình nộp giấy tờ nên quản trị viên tự đối chiếu. */
export default function Verification() {
  const companies = useCatalogStore((s) => s.companies)
  const [tab, setTab] = useState<Tab>('pending')
  const [notice, setNotice] = useState('')
  // Công ty vừa xử lý rời khỏi tab nên đưa focus về dòng thông báo
  const noticeRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (notice) noticeRef.current?.focus()
  }, [notice])

  const inTab = (t: Tab) => companies.filter((c) => c.verified === (t === 'verified'))
  const visible = inTab(tab)

  const toggle = async (c: CatalogCompany) => {
    await setCompanyVerified(c.id, !c.verified)
    // Máy chủ từ chối thì setCompanyVerified đã báo lỗi và kho giữ nguyên: không báo thành công
    const now = useCatalogStore.getState().companies.find((x) => x.id === c.id)?.verified
    if (now === c.verified) return
    setNotice(c.verified ? `Đã bỏ nhãn xác minh của ${c.name}.` : `Đã xác minh ${c.name}.`)
  }

  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    // Điều hướng tab bằng phím mũi tên, Home, End
    let next: number
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (index + TABS.length - 1) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    setTab(TABS[next].value)
    document.getElementById(`vtab-${TABS[next].value}`)?.focus()
  }

  return (
    <div>
      <PageHeader title="Xác minh doanh nghiệp" description="Gắn nhãn đã xác minh cho công ty sau khi bạn đã đối chiếu thông tin của họ." />

      <div role="tablist" aria-label="Trạng thái xác minh" className="flex flex-wrap gap-2">
        {TABS.map((t, i) => {
          const active = tab === t.value
          return (
            <button
              key={t.value} id={`vtab-${t.value}`} type="button" role="tab"
              aria-selected={active} aria-controls="vpanel" tabIndex={active ? 0 : -1}
              onClick={() => setTab(t.value)} onKeyDown={(e) => onTabKey(e, i)}
              className={cn(
                'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300',
                active ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
                FOCUS,
              )}
            >
              {t.label} <span className="tnum">({inTab(t.value).length})</span>
            </button>
          )
        })}
      </div>

      <p ref={noticeRef} tabIndex={-1} role="status" className="my-4 min-h-5 text-sm text-page-fg focus:outline-none">{notice}</p>

      <div id="vpanel" role="tabpanel" aria-labelledby={`vtab-${tab}`}>
        {visible.length === 0 ? (
          <EmptyState icon={BadgeCheck} title={TABS.find((t) => t.value === tab)!.empty} />
        ) : (
          <ul className="space-y-4">
            {visible.map((c) => (
              <li key={c.id} className="rounded-card border border-page-line bg-page-surface p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-medium text-page-fg">{c.name}</h2>
                    <p className="mt-1 text-sm text-page-muted">{[c.industry, c.district, `${c.size} người`].filter(Boolean).join(' · ')}</p>
                    {c.tagline && <p className="mt-1 text-sm text-page-muted">{c.tagline}</p>}
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    {c.locked && <StatusBadge tone="muted">Bị khóa</StatusBadge>}
                    <StatusBadge tone={c.verified ? 'strong' : 'default'}>{c.verified ? 'Đã xác minh' : 'Chưa xác minh'}</StatusBadge>
                  </div>
                </div>
                <div className="mt-5">
                  <button type="button" onClick={() => void toggle(c)} className={c.verified ? BTN_SECONDARY : BTN_PRIMARY}>
                    {c.verified ? <X className="mr-1.5 inline h-4 w-4" aria-hidden="true" /> : <Check className="mr-1.5 inline h-4 w-4" aria-hidden="true" />}
                    {c.verified ? 'Bỏ xác minh' : 'Xác minh'}<span className="sr-only"> {c.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
