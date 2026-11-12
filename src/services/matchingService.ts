// Điểm phù hợp tính trên máy chủ (backend src/matching): nạp, lưu tạm và nạp lại khi dữ liệu liên quan đổi.
// Người tìm việc: GET /matching/jobs (mọi tin đang hiển thị). Nhà tuyển dụng: GET /matching/jobs/:id/candidates, lưu theo từng tin.
import { useCallback, useEffect } from 'react'
import api from './api'
import { useAuthStore } from '@context/authStore'
import { useCatalogStore } from '@context/catalogStore'
import { useMatchingStore, type ServerOutcome, type Weights } from '@context/matchingStore'
import { UNMET_SCORE_CAP, type MatchOutcome } from '@pages/public/match/score'

/**
 * Tính lại điểm tổng từ điểm từng tiêu chí với bộ trọng số khác (vd. người dùng đổi thứ tự ưu tiên)
 * mà không phải gọi lại máy chủ. Thiếu yêu cầu bắt buộc thì bị chặn ở UNMET_SCORE_CAP.
 */
export function reweight(outcome: Pick<MatchOutcome, 'results' | 'unmet'>, weights: Weights): number {
  const raw = Math.round(outcome.results.reduce((sum, r) => sum + r.value * weights[r.key], 0))
  return outcome.unmet.length ? Math.min(raw, UNMET_SCORE_CAP) : raw
}

const role = () => useAuthStore.getState().user?.role
const state = () => useMatchingStore.getState()
const setState = useMatchingStore.setState

type Reply = { weights: Weights; items: ({ jobId?: string; seekerId?: string } & ServerOutcome)[] }
const strip = ({ score, results, missingSkills, unmet, distanceKm }: ServerOutcome): ServerOutcome => ({ score, results, missingSkills, unmet, distanceKm })

/** Tăng mỗi lần đổi tài khoản: phản hồi của tài khoản cũ về muộn thì bỏ */
let generation = 0
/** Yêu cầu đang chạy: gọi lại trong lúc chờ thì dùng chung (StrictMode, nhiều component cùng hỏi) */
let seekerInflight: Promise<void> | null = null
let companyInflight: Promise<void> | null = null

/** Người tìm việc: nạp điểm mọi tin đang hiển thị */
export function loadSeekerMatches(): Promise<void> {
  if (role() !== 'jobseeker') return Promise.resolve()
  if (seekerInflight) return seekerInflight
  const gen = generation
  if (state().jobsStatus !== 'ready') setState({ jobsStatus: 'loading' })
  seekerInflight = (async () => {
    try {
      const { data } = await api.get<Reply>('/matching/jobs')
      if (gen !== generation) return
      setState({
        weights: data.weights,
        jobsStatus: 'ready',
        jobs: Object.fromEntries(data.items.map((i) => [i.jobId as string, strip(i)])),
      })
    } catch {
      if (gen === generation && state().jobsStatus !== 'ready') setState({ jobsStatus: 'error' })
    } finally {
      if (gen === generation) seekerInflight = null
    }
  })()
  return seekerInflight
}

type CompanyReply = { weights: Weights; jobs: Record<string, ({ seekerId: string } & ServerOutcome)[]> }

/**
 * Nhà tuyển dụng: nạp điểm ứng viên cho MỌI tin của công ty trong một lần gọi.
 * `wanted`: các tin đang được hỏi — tin không có trong kết quả (vừa tạo, không thuộc công ty) được ghi rỗng để không hỏi lại mãi.
 */
export function loadCompanyMatches(wanted: string[] = []): Promise<void> {
  if (role() !== 'recruiter') return Promise.resolve()
  if (companyInflight) return companyInflight
  const gen = generation
  setState((s) => ({
    candidates: {
      ...s.candidates,
      ...Object.fromEntries(wanted.filter((id) => s.candidates[id]?.status !== 'ready').map((id) => [id, { status: 'loading' as const, items: {} }])),
    },
  }))
  companyInflight = (async () => {
    try {
      const { data } = await api.get<CompanyReply>('/matching/candidates')
      if (gen !== generation) return
      const loaded = Object.fromEntries(Object.entries(data.jobs).map(([jobId, items]) => [
        jobId, { status: 'ready' as const, items: Object.fromEntries(items.map((i) => [i.seekerId, strip(i)])) },
      ]))
      const missing = Object.fromEntries(wanted.filter((id) => !loaded[id]).map((id) => [id, { status: 'ready' as const, items: {} }]))
      setState({ weights: data.weights, candidates: { ...missing, ...loaded } })
    } catch {
      if (gen === generation) {
        setState((s) => ({
          candidates: Object.fromEntries(Object.entries(s.candidates).map(([id, c]) => [id, c.status === 'loading' ? { status: 'error' as const, items: {} } : c])),
        }))
      }
    } finally {
      if (gen === generation) companyInflight = null
    }
  })()
  return companyInflight
}

/** Giữ tên cũ cho chỗ gọi theo một tin: nạp cả công ty (một lần gọi) */
export const loadCandidateMatches = (jobId: string) => loadCompanyMatches([jobId])

/** Nạp lại những gì đang giữ (tin của người tìm việc / mọi tin của nhà tuyển dụng) */
export function refreshMatching(): void {
  if (role() === 'jobseeker') void loadSeekerMatches()
  else if (role() === 'recruiter' && Object.keys(state().candidates).length) void loadCompanyMatches()
}

let timer: ReturnType<typeof setTimeout> | null = null
/** Gom nhiều thay đổi liên tiếp (lưu hồ sơ, nạp danh mục, sự kiện cặp) thành một lần nạp */
export function scheduleMatchingRefresh(delay = 400): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { timer = null; refreshMatching() }, delay)
}

/** Đăng nhập / đăng xuất / đổi tài khoản: xóa điểm cũ, người tìm việc nạp ngay */
let lastAccount: string | null | undefined = null
export function resetMatching(): void {
  // Cùng tài khoản (vd. StrictMode chạy effect hai lần) → giữ kết quả / yêu cầu đang chạy, không gọi lại
  const account = useAuthStore.getState().user?.id
  if (account === lastAccount) return
  lastAccount = account
  generation++
  seekerInflight = null
  companyInflight = null
  if (timer) { clearTimeout(timer); timer = null }
  state().clear()
  if (role() === 'jobseeker') void loadSeekerMatches()
}

// Danh mục tin đổi (tin mới, tin đóng…) thì điểm có thể đổi. Chỉ nạp lại khi tập tin thật sự khác:
// lần nạp danh mục đầu tiên (thay dữ liệu mẫu) hoặc nạp lại y hệt thì không cần, vì điểm đã được nạp ngay khi đăng nhập.
const idsOf = (jobs: { id: string }[]) => jobs.map((j) => j.id).sort().join('|')
useCatalogStore.subscribe((s, prev) => {
  // prev chưa `loaded` = đang là dữ liệu mẫu ban đầu (catalogSeed), không phải thay đổi thật
  if (s.jobs === prev.jobs || !prev.loaded || !role()) return
  if (idsOf(s.jobs) !== idsOf(prev.jobs)) scheduleMatchingRefresh()
})

/** Hook cho người tìm việc: `ready` = đã có kết quả (hoặc lỗi); `outcomeOf` trả undefined nếu tin chưa có điểm */
export function useSeekerMatches() {
  const jobs = useMatchingStore((s) => s.jobs)
  const status = useMatchingStore((s) => s.jobsStatus)
  const weights = useMatchingStore((s) => s.weights)
  // Đổi tham chiếu chỉ khi điểm đổi, để dùng được trong dependency của useMemo
  const outcomeOf = useCallback((jobId: string): ServerOutcome | undefined => jobs[jobId], [jobs])
  return { ready: status === 'ready' || status === 'error', weights, outcomeOf }
}

/** Hook cho nhà tuyển dụng: tự nạp điểm của các tin được hỏi, `ready` khi tất cả đã xong (hoặc lỗi) */
export function useCandidateMatches(jobIds: string[]) {
  const candidates = useMatchingStore((s) => s.candidates)
  const weights = useMatchingStore((s) => s.weights)
  const key = jobIds.join('|')
  useEffect(() => {
    const missing = (key ? key.split('|') : []).filter((id) => !state().candidates[id])
    if (missing.length) void loadCompanyMatches(missing)
  }, [key])
  const outcomeOf = useCallback((jobId: string, seekerId: string): ServerOutcome | undefined => candidates[jobId]?.items[seekerId], [candidates])
  return { ready: jobIds.every((id) => candidates[id] && candidates[id].status !== 'loading'), weights, outcomeOf }
}
