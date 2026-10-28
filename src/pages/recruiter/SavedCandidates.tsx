import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bookmark } from 'lucide-react'
import { EmptyState, MatchScore, MockNotice, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { useMatchStore } from '@context/matchStore'
import { candidatesOf, POSITIONS } from '@pages/public/match/data'
import { scoreMatch } from '@pages/public/match/score'
import { expressInterest, useOnNewConnection, usePairStatuses } from '@services/connectionService'
import { FOCUS } from '@utils/focus'

const BTN = `inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${FOCUS}`
const BTN_SOLID = `${BTN} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg`
const BTN_LINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`

/** Ứng viên đã lưu: nhóm theo tin tuyển dụng, kèm điểm với tin đó và trạng thái quan tâm. */
export default function SavedCandidates() {
  const savedCandidates = useMatchStore((s) => s.savedCandidates)
  const toggleSaved = useMatchStore((s) => s.toggleSavedCandidate)
  const statusOf = usePairStatuses('recruiter')

  useOnNewConnection(() => toast.success('Kết nối thành công'))

  // Khóa dạng `positionId:candidateId` → nhóm theo tin; bỏ khóa không còn khớp dữ liệu
  const groups = POSITIONS.map((position) => ({
    position,
    rows: savedCandidates.flatMap((key) => {
      const i = key.indexOf(':')
      if (key.slice(0, i) !== position.id) return []
      const cand = candidatesOf(position.id).find((c) => c.id === key.slice(i + 1))
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
          action={<Link to="/tuyen-dung/tim-ung-vien" className={BTN_SOLID}>Tìm ứng viên</Link>}
        />
      ) : (
        <div className="space-y-6">
          {groups.map(({ position, rows }) => (
            <Panel key={position.id} title={position.job.title}>
              <ul className="divide-y divide-page-line">
                {rows.map(({ key, cand, score }) => {
                  const status = statusOf(position.id, cand.id)
                  return (
                    <li key={key} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="font-medium text-page-fg">{cand.name}</span>
                          {status === 'sent' && <StatusBadge tone="default">Đã quan tâm</StatusBadge>}
                          {status === 'received' && <StatusBadge tone="default">Ứng viên quan tâm bạn</StatusBadge>}
                          {status === 'connected' && <StatusBadge tone="strong">Đã kết nối</StatusBadge>}
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
                              className={BTN_SOLID}
                              onClick={() => {
                                expressInterest('recruiter', position.id, cand.id)
                                toast.success('Đã quan tâm — chờ ứng viên phản hồi')
                              }}
                            >
                              Quan tâm
                            </button>
                          )}
                          {status === 'received' && (
                            <button type="button" className={BTN_SOLID} onClick={() => expressInterest('recruiter', position.id, cand.id)}>
                              Đồng ý kết nối
                            </button>
                          )}
                          {status === 'connected' && (
                            <Link to={`/tin-nhan?c=${position.id}|${cand.id}`} className={BTN_SOLID}>Nhắn tin</Link>
                          )}
                          <button
                            type="button"
                            className={BTN_LINE}
                            onClick={() => {
                              toggleSaved(key)
                              toast('Đã bỏ lưu')
                            }}
                          >
                            Bỏ lưu
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      <div className="mt-6"><MockNotice /></div>
    </div>
  )
}
