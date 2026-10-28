import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bookmark, Check, Clock, MapPin, UserCheck, UserX, Wallet } from 'lucide-react'
import { EmptyState, MatchScore, MockNotice, StatusBadge } from '@components/dashboard'
import { candidateKey, useMatchStore } from '@context/matchStore'
import { useSmoothScroll } from '@hooks/useSmoothScroll'
import { JOB_TYPES } from '@constants/index'
import { SEEKER_PUBLIC_HREF } from '@pages/public/personal/links'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { CANDIDATES, POSITIONS, type MatchCandidate, type MatchPosition } from './data'
import CurvedGallery from './gallery/CurvedGallery'
import MatchArches from './MatchArches'
import MatchDetail from './MatchDetail'
import { CriterionBars, DetailSection, FactTiles, ImproveHint, TagList } from './detailParts'
import {
  Avatar, BTN_PRIMARY, BTN_SECONDARY, CheckList, filterByLevel, GalleryCaption, LevelFilter, MatchFrame, personInitials, Tabs, ViewToggle,
  type LevelKey,
} from './parts'
import { DEFAULT_PRIORITY, scoreMatch, weightsOf, type CriterionResult } from './score'

type TabKey = 'fit' | 'saved' | 'invited'

/** Lời ghi chú nhìn từ phía doanh nghiệp (score.ts viết từ phía người tìm việc). */
function recruiterNote(r: CriterionResult) {
  if (r.key === 'salary') return r.ok ? 'Lương' : 'Mong muốn cao hơn mức tin'
  if (r.key === 'jobType') return r.ok ? 'Loại việc' : 'Muốn loại việc khác'
  return r.note
}

/** Nhà tuyển dụng: chọn vị trí, xem ứng viên xếp theo điểm, mời / lưu / bỏ qua. */
export default function RecruiterMatch() {
  const { savedCandidates, invitedCandidates, skippedCandidates, toggleSavedCandidate, inviteCandidate, skipCandidate, unskipCandidates } =
    useMatchStore()
  const view = useMatchStore((s) => s.view)
  const setView = useMatchStore((s) => s.setView)
  const gallery = view === 'gallery'
  // Lenis chỉ chạy ở Bộ sưu tập (canvas WebGL cần cuộn mượt đồng bộ); chế độ Danh sách giữ cuộn thường
  useSmoothScroll(gallery)
  // Tin vừa soạn ở /dang-tin (chưa lưu, tải lại là mất) nằm đầu danh sách vị trí
  // Tin vừa đăng (chuyền qua state lúc chuyển trang, không lưu): đọc một lần rồi xóa khỏi
  // history — nếu không, trình duyệt giữ state qua F5 và tin "chưa lưu" vẫn còn sau khi tải lại
  const locState = useLocation().state as { draftPosition?: MatchPosition } | null
  const [draft] = useState(() => locState?.draftPosition)
  useEffect(() => {
    if (window.history.state?.usr?.draftPosition) {
      window.history.replaceState({ ...window.history.state, usr: null }, '')
    }
  }, [])
  const positions = useMemo(() => (draft ? [draft, ...POSITIONS] : POSITIONS), [draft])
  const [positionId, setPositionId] = useState(positions[0].id)
  const [tab, setTab] = useState<TabKey>('fit')
  // Bộ sưu tập: lọc theo mức phù hợp; thẻ đang mở chi tiết (kèm nút gốc để ảnh phóng ra / thu về)
  const [level, setLevel] = useState<LevelKey>('all')
  const [open, setOpen] = useState<{ id: string; origin: HTMLElement } | null>(null)

  const position = positions.find((p) => p.id === positionId) ?? positions[0]
  const { job, req } = position

  // Chấm điểm ứng viên của vị trí đang chọn (ưu tiên mặc định), cao trước
  const scored = useMemo(
    () =>
      (position.id === 'draft'
        ? CANDIDATES.filter((c, i, all) => all.findIndex((x) => x.name === c.name) === i)
        : CANDIDATES.filter((c) => c.positionId === position.id)
      )
        .map((c) => ({ c, key: candidateKey(position.id, c.id), outcome: scoreMatch(c.criteria, req, c.distanceKm) }))
        .sort((a, b) => b.outcome.score - a.outcome.score),
    [position.id, req],
  )

  const skipped = scored.filter((x) => skippedCandidates.includes(x.key))
  const lists = {
    fit: scored.filter((x) => !invitedCandidates.includes(x.key) && !skippedCandidates.includes(x.key)),
    saved: scored.filter((x) => savedCandidates.includes(x.key) && !skippedCandidates.includes(x.key)),
    invited: scored.filter((x) => invitedCandidates.includes(x.key)),
  }
  const current = lists[tab]
  const shown = gallery ? filterByLevel(current, level, (x) => x.outcome.score) : current
  const detail = open ? scored.find((x) => x.key === open.id) : undefined

  const jobTypeLabel = JOB_TYPES.find((t) => t.value === req.jobType)?.label ?? req.jobType

  const invite = (c: MatchCandidate, key: string) => {
    inviteCandidate(key)
    // Ở lại tab hiện tại để mời tiếp; ứng viên chuyển sang tab Đã mời phỏng vấn
    toast.success(`Đã mời ${c.name} phỏng vấn`)
  }

  // Hàng nút của một ứng viên — dùng chung cho thẻ danh sách và khung chi tiết.
  // `close` chỉ có ở khung chi tiết: mời / bỏ qua làm thẻ rời tab nên đóng khung (mờ dần) sau khi bấm.
  const candActions = (c: MatchCandidate, key: string, close?: (quick?: boolean) => void) => {
    const saved = savedCandidates.includes(key)
    const invited = invitedCandidates.includes(key)
    return (
      <>
        {invited ? (
          <button type="button" disabled className={BTN_SECONDARY}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Đã mời
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              invite(c, key)
              close?.(true)
            }}
            className={BTN_PRIMARY}
          >
            Mời phỏng vấn<span className="sr-only"> {c.name}</span>
          </button>
        )}
        <Link to={SEEKER_PUBLIC_HREF} className={BTN_SECONDARY}>
          Xem hồ sơ<span className="sr-only"> {c.name}</span>
        </Link>
        <button type="button" aria-pressed={saved} onClick={() => toggleSavedCandidate(key)} className={BTN_SECONDARY}>
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />
          {saved ? 'Đã lưu' : 'Lưu'}
          <span className="sr-only"> {c.name}</span>
        </button>
        {!invited && (
          <button
            type="button"
            onClick={() => {
              skipCandidate(key)
              toast(`Đã bỏ qua ${c.name}`)
              close?.(true)
            }}
            className={BTN_SECONDARY}
          >
            Bỏ qua<span className="sr-only"> {c.name}</span>
          </button>
        )}
      </>
    )
  }

  const availabilityBadge = (c: MatchCandidate) =>
    c.availability.kind === 'ready' ? (
      <StatusBadge tone="strong">Sẵn sàng từ {c.availability.from}</StatusBadge>
    ) : (
      <StatusBadge tone="muted">Đang đi làm</StatusBadge>
    )

  return (
    <>
    {gallery && <MatchArches />}
    {/* relative z-10: nội dung nằm trên các khối vòm nền */}
    <div className="relative z-10">
    <MatchFrame title="Ứng viên hợp với từng vị trí" intro="Chọn một vị trí, danh sách ứng viên xếp theo mức phù hợp với yêu cầu của tin.">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <label htmlFor="match-position" className="text-sm text-page-muted">Đang tìm ứng viên cho:</label>
        <select
          id="match-position"
          value={positionId}
          onChange={(e) => {
            setPositionId(e.target.value)
            setLevel('all')
          }}
          className={`max-w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`}
        >
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.job.title}
              {p.job.status === 'paused' ? ' (tạm dừng)' : ''}
              {p.id === 'draft' ? ' (vừa đăng — chưa lưu)' : ''}
            </option>
          ))}
        </select>
        <ViewToggle value={view} onChange={setView} />
      </div>
      <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-relaxed text-page-muted">
        Yêu cầu: kỹ năng {req.skills.join(', ')} · {job.schedule} · lương {job.salary} · loại việc {jobTypeLabel} · bán kính {position.radiusKm} km
      </p>

      <div className="mx-auto mt-8 max-w-6xl">
        <Tabs
          center
          toolbar={
            gallery ? (
              <div className="mt-4 flex justify-center">
                <LevelFilter scores={current.map((x) => x.outcome.score)} value={level} onChange={setLevel} />
              </div>
            ) : undefined
          }
          idPrefix="cands"
          label="Danh sách ứng viên"
          tabs={[
            { id: 'fit', label: 'Phù hợp', count: lists.fit.length },
            { id: 'saved', label: 'Đã lưu', count: lists.saved.length },
            { id: 'invited', label: 'Đã mời phỏng vấn', count: lists.invited.length },
          ]}
          value={tab}
          onChange={(id) => {
            setTab(id as TabKey)
            setLevel('all')
          }}
        >
          {shown.length === 0 ? (
            <EmptyState
              icon={UserX}
              title={
                current.length > 0
                  ? 'Không có ứng viên ở mức này'
                  : tab === 'fit' ? 'Hết ứng viên để xem' : tab === 'saved' ? 'Chưa lưu ứng viên nào' : 'Chưa mời ai phỏng vấn'
              }
              description={
                current.length > 0
                  ? 'Chọn mức phù hợp khác hoặc Tất cả để xem các ứng viên còn lại.'
                  : tab === 'fit'
                  ? 'Bạn đã mời hoặc bỏ qua hết ứng viên của vị trí này.'
                  : tab === 'saved'
                    ? 'Bấm Lưu ở một ứng viên để xem lại tại đây.'
                    : 'Ứng viên bạn mời sẽ nằm ở đây.'
              }
            />
          ) : gallery ? (
            <CurvedGallery
              items={shown.map((x) => ({ id: x.key, photo: x.c.photo, ...x }))}
              label="Danh sách ứng viên dạng bộ sưu tập"
              itemLabel={({ c, outcome }) => `${c.name}, phù hợp ${outcome.score}%. Mở chi tiết`}
              renderCaption={({ c, outcome }) => (
                <GalleryCaption title={c.name} subtitle={`${c.summary} · ${c.area}`} score={outcome.score} />
              )}
              onOpen={(item, origin) => setOpen({ id: item.id, origin })}
              hiddenId={open?.id ?? null}
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {current.map(({ c, key, outcome }) => {
                return (
                  <li key={key} className="min-w-0">
                    <article className="flex h-full flex-col rounded-card border border-page-line bg-page-surface p-5 md:p-6">
                      <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-3 sm:grid-cols-[auto_1fr_auto]">
                        <Avatar text={personInitials(c.name)} />
                        <div className="min-w-0">
                          <h3 className="font-display text-lg font-medium text-page-fg">{c.name}</h3>
                          <p className="mt-1 text-sm text-page-muted">{c.summary}</p>
                          <p className="text-sm text-page-muted">{c.area} · cách {c.distanceKm} km</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <MatchScore score={outcome.score} />
                        </div>
                      </div>
                      <div className="mt-3">{availabilityBadge(c)}</div>
                      <CheckList results={outcome.results} missingSkills={outcome.missingSkills} noteOf={recruiterNote} />
                      <div className="mt-auto flex flex-wrap gap-2 pt-5">{candActions(c, key)}</div>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}

          {skipped.length > 0 && tab !== 'invited' && (
            <p className="mt-6 text-sm text-page-muted">
              Đã bỏ qua <span className="tnum">{skipped.length}</span> ứng viên ·{' '}
              <button
                type="button"
                onClick={() => unskipCandidates(skipped.map((x) => x.key))}
                className={`rounded-control text-page-fg underline underline-offset-4 ${FOCUS}`}
              >
                Hiện lại
              </button>
            </p>
          )}
        </Tabs>
      </div>

      <div className="mx-auto mt-8 flex justify-center">
        <MockNotice />
      </div>
    </MatchFrame>
    </div>

    {detail && open && (() => {
      const { c, key, outcome } = detail
      const matched = req.slots.filter((s) => c.criteria.slots.includes(s)).length
      return (
        <MatchDetail
          key={open.id}
          photo={c.photo}
          title={c.name}
          eyebrow={`${c.area} · cách ${c.distanceKm} km`}
          score={outcome.score}
          origin={open.origin}
          onClosed={() => setOpen(null)}
          actions={(close) => candActions(c, key, close)}
        >
          <div className="mt-6">
            <FactTiles
              items={[
                { icon: Wallet, label: 'Lương mong muốn', value: <><span className="tnum">{c.criteria.salaryMinK}.000</span>đ/giờ</> },
                { icon: Clock, label: 'Lịch rảnh', value: <><span className="tnum">{matched}/{req.slots.length}</span> ca khớp</> },
                { icon: MapPin, label: 'Khoảng cách', value: `${c.distanceKm} km` },
                { icon: UserCheck, label: 'Trạng thái', value: c.availability.kind === 'ready' ? `Sẵn sàng từ ${c.availability.from}` : 'Đang đi làm' },
              ]}
            />
          </div>
          <DetailSection title="Mức độ khớp với tin">
            <CriterionBars results={outcome.results} weights={weightsOf(DEFAULT_PRIORITY)} noteOf={recruiterNote} />
            {outcome.missingSkills.length > 0 && (
              <ImproveHint>
                Ứng viên còn thiếu: <strong className="font-medium">{outcome.missingSkills.join(', ')}</strong>.
              </ImproveHint>
            )}
          </DetailSection>
          <DetailSection title="Về ứng viên">
            <p className="text-sm leading-relaxed text-page-muted">{c.summary}</p>
            <TagList tags={c.criteria.skills} />
          </DetailSection>
        </MatchDetail>
      )
    })()}
    </>
  )
}
