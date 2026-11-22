import { useBlocker, type BlockerFunction } from 'react-router-dom'
import { useCallback } from 'react'
import { ArrowRight, CornerUpLeft } from 'lucide-react'
import DialogShell from '@components/interview/DialogShell'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'
import { BTN_PRIMARY, BTN_SECONDARY } from '@utils/ui'
import { AREA_HOME_LABEL, areaOf, currentPageName, needsLeaveConfirm, pageMeta, resolveAlias } from './leaveDashboard'

/**
 * Hỏi lại trước khi rời khu làm việc (dashboard) sang bất kỳ trang nào ngoài khu — chặn MỌI kiểu điều hướng
 * của router: liên kết, nút gọi navigate(), chuyển hướng <Navigate>, nút Back/Forward của trình duyệt.
 * Không hỏi khi: đi trong cùng khu, cùng đường dẫn (mở tin chi tiết ?tin=, đổi #neo), hoặc đã đăng xuất
 * (đăng xuất xong khung tự chuyển về trang đăng nhập).
 * `tone`: 'abyss' cho khung kính xanh (/tim-viec, /tuyen-dung), 'ivory' cho khu quản trị.
 */
export default function LeaveDashboardDialog({ tone = 'ivory' }: { tone?: 'ivory' | 'abyss' }) {
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      !!useAuthStore.getState().token && needsLeaveConfirm(currentLocation.pathname, nextLocation.pathname),
    [],
  )
  const blocker = useBlocker(shouldBlock)
  if (blocker.state !== 'blocked') return null

  const here = window.location.pathname
  const area = areaOf(here)
  const to = resolveAlias(blocker.location.pathname)
  const dest = pageMeta(to)
  const Icon = dest.icon
  const abyss = tone === 'abyss'
  const stay = () => blocker.reset()

  return (
    <DialogShell titleId="leave-dashboard-title" title="Rời khu làm việc?" onClose={stay} tone={tone} className="md:max-w-md">
      {/* Nơi đang đứng → nơi sẽ đến */}
      <p className="flex flex-wrap items-center gap-2 text-sm text-page-muted">
        <span className="font-medium text-page-fg">{currentPageName(here)}</span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">sang</span>
        <span className="font-medium text-page-fg">{dest.name}</span>
      </p>

      {/* Trang đích: biểu tượng + mô tả */}
      <div
        className={cn(
          'mt-4 flex items-start gap-3 rounded-card border p-4',
          abyss ? 'border-wm-ivory/15 bg-wm-ivory/[0.06]' : 'border-page-line bg-page-surface',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            abyss ? 'bg-wm-cyan/15 text-wm-cyan' : 'bg-page-fg text-page-bg',
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-page-fg">Bạn sẽ được chuyển đến {dest.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-page-muted">{dest.desc}</p>
        </div>
      </div>

      {/* Cách quay lại */}
      {area && (
        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-page-muted">
          <CornerUpLeft className={cn('mt-0.5 h-4 w-4 shrink-0', abyss && 'text-wm-cyan')} aria-hidden="true" />
          <span>
            Quay lại bất cứ lúc nào: bấm vào tài khoản ở góc phải trên, chọn <span className="font-medium text-page-fg">{AREA_HOME_LABEL[area]}</span>.
          </span>
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={stay} className={BTN_SECONDARY}>Ở lại</button>
        <button type="button" onClick={() => blocker.proceed()} className={BTN_PRIMARY}>Tiếp tục</button>
      </div>
    </DialogShell>
  )
}
