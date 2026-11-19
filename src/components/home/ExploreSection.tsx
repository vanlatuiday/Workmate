import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { JOB_TYPES } from '@constants/index'
import { DISTRICTS, EMPTY_FILTERS, filtersToParams, useAllJobs } from '@pages/public/jobs/catalog'
import TextReveal from '@components/motion/TextReveal'
import { homeSections, homeSectionsByRole } from './content'
import { useHomeCandidates, useHomeRole } from './homeData'

import { HOME_GLASS_DARK } from './homeBackground'

const toJobs = (f: Parameters<typeof filtersToParams>[0]) => `/viec-lam?${filtersToParams(f)}`

const chip =
  `inline-flex min-h-11 items-center rounded-full border border-wm-ivory/30 ${HOME_GLASS_DARK} px-4 text-sm text-wm-ivory ` +
  'transition-[color,border-color,transform] duration-300 hover:border-page-fg hover:text-page-fg focus-visible:border-page-fg focus-visible:text-page-fg ' +
  'active:scale-[0.97] motion-reduce:active:scale-100'

const CANDIDATES_HREF = '/tuyen-dung/tim-ung-vien'

type Chip = { key: string; label: string; href: string }

/**
 * Section ⑤ — hai nhóm liên kết dạng chip (nhóm ngành đã chuyển sang bảng ca ở dưới hero).
 * Khách / người tìm việc: khu vực + hình thức → /viec-lam.
 * Nhà tuyển dụng: khu vực + kỹ năng → ứng viên (trang Tìm ứng viên chưa đọc
 * tham số URL nên mọi liên kết dẫn về trang đó, chưa lọc sẵn).
 */
export default function ExploreSection() {
  const role = useHomeRole()
  const recruiter = role === 'recruiter'
  const jobs = useAllJobs()
  const candidates = useHomeCandidates()
  const jobCopy = homeSections.explore
  const rcopy = homeSectionsByRole.recruiter.explore

  const { title, labels, lists } = useMemo(() => {
    if (recruiter) {
      const skillCount = new Map<string, number>()
      const areaCount = new Map<string, number>()
      candidates.forEach((c) => {
        areaCount.set(c.area, (areaCount.get(c.area) ?? 0) + 1)
        c.criteria.skills.forEach((sk) => skillCount.set(sk, (skillCount.get(sk) ?? 0) + 1))
      })
      const byName = (a: [string, number], b: [string, number]) => a[0].localeCompare(b[0], 'vi')
      return {
        title: rcopy.title,
        labels: [rcopy.districts, rcopy.skills],
        lists: [
          [...areaCount].sort(byName).map<Chip>(([a, n]) => ({ key: a, label: `${a} · ${n}`, href: CANDIDATES_HREF })),
          [...skillCount].sort(byName).map<Chip>(([sk, n]) => ({ key: sk, label: `${sk} · ${n}`, href: CANDIDATES_HREF })),
        ],
      }
    }
    // Chỉ liệt kê hình thức đang có việc
    const types = JOB_TYPES.filter((t) => jobs.some((j) => j.jobType === t.value))
    return {
      title: jobCopy.title,
      labels: [jobCopy.districts, jobCopy.types],
      lists: [
        DISTRICTS.map<Chip>((d) => ({ key: d, label: d, href: toJobs({ ...EMPTY_FILTERS, district: d }) })),
        types.map<Chip>((t) => ({ key: t.value, label: t.label, href: toJobs({ ...EMPTY_FILTERS, type: t.value }) })),
      ],
    }
  }, [recruiter, jobs, candidates, jobCopy, rcopy])

  return (
    <section data-theme="night" className="relative z-10 shell pb-section" aria-labelledby="home-explore-title">
      <TextReveal
        id="home-explore-title"
        text={title}
        className="font-display text-display-sm font-semibold text-page-fg"
      />

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        {lists.map((chips, i) => (
          <div key={labels[i]}>
            <h3 className="text-sm font-medium text-page-muted">{labels[i]}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c.key}>
                  <Link to={c.href} className={chip}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
