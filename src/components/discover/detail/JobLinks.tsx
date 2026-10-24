import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@components/motion/Reveal'
import type { MockJob } from '@pages/jobseeker/mockData'
import { FOCUS } from '@utils/focus'


/** Danh sách việc đang tuyển, mỗi dòng là link tới /viec-lam/:id. */
export default function JobLinks({ jobs }: { jobs: MockJob[] }) {
  if (!jobs.length) return <p className="text-page-muted">Hiện chưa có tin đang mở.</p>
  return (
    <Reveal>
      <ul className="divide-y divide-page-line border-y border-page-line">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link
              to={`/viec-lam/${j.id}`}
              className={`group flex items-center justify-between gap-6 rounded-control py-5 ${FOCUS}`}
            >
              <span>
                <span className="block font-display text-lg font-medium">{j.title}</span>
                <span className="mt-1 block text-sm text-page-muted">
                  {j.salaryLabel} · {j.shift} · {j.district}
                </span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform duration-500 ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  )
}
