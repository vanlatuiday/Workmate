import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from '@components/motion/Reveal'
import { useAuthStore } from '@context/authStore'
import { useSeekerOutcomes, type MatchJob } from '@pages/public/jobs/catalog'
import { FOCUS } from '@utils/focus'

/** Danh sách việc đang tuyển: mỗi dòng là một link tới /viec-lam/:id, người tìm việc thấy thêm % phù hợp. */
export default function JobLinks({ jobs }: { jobs: MatchJob[] }) {
  const isSeeker = useAuthStore((s) => s.user?.role === 'jobseeker')
  const { outcomeOf } = useSeekerOutcomes()
  if (!jobs.length) return <p className="text-page-muted">Hiện chưa có tin đang mở.</p>
  return (
    <Reveal>
      <ul className="space-y-3">
        {jobs.map((j) => {
          const score = isSeeker ? outcomeOf(j)?.score : undefined
          return (
            <li key={j.id}>
              <Link
                to={`/viec-lam/${j.id}`}
                state={{ from: '/viec-lam' }}
                className={`group day-card flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-card border border-page-line p-4 transition-colors duration-fast hover:border-page-fg md:px-5 ${FOCUS}`}
              >
                <span className="min-w-0">
                  <span className="block font-display text-lg font-medium">{j.title}</span>
                  <span className="mt-1 block text-sm text-page-muted">
                    {j.salaryLabel} · {j.shiftLabel} · {j.district}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-sm">
                  {score != null && (
                    <span className="tnum rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">
                      Phù hợp {score}%
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    Xem việc
                    <ArrowRight className="h-4 w-4 transition-transform duration-slow ease-editorial group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Reveal>
  )
}
