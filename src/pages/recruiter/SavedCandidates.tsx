import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { candidateHref } from '@pages/public/personal/links'
import { notifySuccess } from '@utils/feedback'
import { Bookmark } from 'lucide-react'
import { EmptyState, MatchScore, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { useMatchStore } from '@context/matchStore'
import { useCandidates, usePositions } from '@pages/public/match/data'
import { scoreMatch } from '@pages/public/match/score'
import { expressInterest, useOnNewConnection, usePairStatuses } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import FadeIn from '@components/motion/FadeIn'
import { useFlip } from '@hooks/useFlip'
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import MessageLink from '@components/messenger/MessageLink'


/** Danh sách dòng của một nhóm: sắp xếp lại mượt khi bỏ lưu (mỗi nhóm một ref riêng) */
function FlipList({ keys, children }: { keys: string[]; children: ReactNode }) {
  const ref = useFlip<HTMLUListElement>(keys)
  return <ul ref={ref} className="divide-y divide-page-line">{children}</ul>
}

/** Ứng viên đã lưu: nhóm theo tin tuyển dụng, kèm điểm với tin đó và trạng thái quan tâm. */
export default function SavedCandidates() {
  const savedCandidates = useMatchStore((s) => s.savedCandidates)
  const toggleSaved = useMatchStore((s) => s.toggleSavedCandidate)
  const statusOf = usePairStatuses('recruiter')
  const positions = usePositions()
  const candidates = useCandidates()

  useOnNewConnection(() => notifySuccess('Đã kết nối — giờ hai bên nhắn tin được'))

  // Khóa dạng `positionId:candidateId` → nhóm theo tin; bỏ khóa không còn khớp dữ liệu
  const groups = positions.map((position) => ({
    position,
    rows: savedCandidates.flatMap((key) => {
      const i = key.indexOf(':')
      if (key.slice(0, i) !== position.id) return []
      const cand = candidates.find((c) => c.id === key.slice(i + 1))
      return cand ? [{ key, cand, score: scoreMatch(cand.criteria, position.req, cand.distanceKm).score }] : []
    }),
  })).filter((g) => g.rows.length > 0)

  return (
    <div>
      <PageHeader title="Ứng viên đã lưu" description="Những ứng viên bạn đánh dấu để cân nhắc, nhóm theo tin tuyển dụng." />

      {groups.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Chưa lưu ứng viên nào"
          description="Lưu ứng viên ở trang Kết nối hoặc Tìm ứng viên để xem lại tại đây."
          action={<Link to="/tuyen-dung/tim-ung-vien" className={BTN_ACCENT}>Tìm ứng viên</Link>}
        />
      ) : (
        <div className="space-y-6">
          {groups.map(({ position, rows }) => (
            <FadeIn key={position.id}>
            <Panel title={position.job.title}>
              <FlipList keys={rows.map((r) => r.key)}>
                {rows.map(({ key, cand, score }) => {
                  const status = statusOf(position.id, cand.id)
                  return (
                    <li key={key} data-flip-key={key} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <Link to={candidateHref(cand.id)} className={cn('rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>{cand.name}</Link>
                          {status === 'sent' && <StatusBadge tone="neutral">Đã quan tâm</StatusBadge>}
                          {status === 'received' && <StatusBadge tone="soft">Ứng viên quan tâm bạn</StatusBadge>}
                          {status === 'connected' && <StatusBadge tone="accent">Đã kết nối</StatusBadge>}
                        </div>
                        <p className="mt-1 text-sm text-page-muted">{cand.summary}</p>
                        <p className="mt-1 text-xs text-page-muted">{cand.area} · cách {cand.distanceKm} km</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:flex-shrink-0">
                        <MatchScore score={score} size="sm" />
                        <div className="flex flex-wrap items-center gap-2">
                          {status === 'none' && (
                            <button
                              type="button"
                              className={cn(BTN_PRIMARY, BTN_SM)}
                              onClick={() => {
                                expressInterest('recruiter', position.id, cand.id)
                              }}
                            >
                              Quan tâm
                            </button>
                          )}
                          {status === 'received' && (
                            <button type="button" className={cn(BTN_PRIMARY, BTN_SM)} onClick={() => expressInterest('recruiter', position.id, cand.id)}>
                              Đồng ý kết nối
                            </button>
                          )}
                          {status === 'connected' && (
                            <MessageLink convKey={`${position.id}|${cand.id}`} className={cn(BTN_PRIMARY, BTN_SM)}>Nhắn tin</MessageLink>
                          )}
                          <button
                            type="button"
                            className={cn(BTN_SECONDARY, BTN_SM)}
                            onClick={() => {
                              toggleSaved(key)
                            }}
                          >
                            Bỏ lưu
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </FlipList>
            </Panel>
            </FadeIn>
          ))}
        </div>
      )}

    </div>
  )
}
