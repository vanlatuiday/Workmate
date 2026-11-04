import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { photoSrcSet, photoUrl } from '@components/discover/types'
import { JOB_TYPES } from '@constants/index'
import { DISTRICTS, EMPTY_FILTERS, filtersToParams, jobMatches, useAllJobs } from '@pages/public/jobs/catalog'
import TextReveal from '@components/motion/TextReveal'
import { cn } from '@utils/cn'
import { homeMedia } from './homeMedia'
import { homeSections, homeSectionsByRole } from './content'
import { norm, useHomeCandidates, useHomeRole } from './homeData'

const toJobs = (f: Parameters<typeof filtersToParams>[0]) => `/viec-lam?${filtersToParams(f)}`

const chip =
  'inline-flex min-h-11 items-center rounded-full border border-page-line px-4 text-sm text-page-muted ' +
  'transition-colors duration-300 hover:border-page-fg hover:text-page-fg'

const CANDIDATES_HREF = '/tuyen-dung/tim-ung-vien'

type Tile = { key: string; label: string; photo: { id: string; alt: string }; href: string; count: number }
type Chip = { key: string; label: string; href: string }

/**
 * Section ⑤ — ô nhóm có ảnh (đếm thật) và hai danh sách liên kết.
 * Khách / người tìm việc: nhóm ngành → /viec-lam, khu vực + hình thức.
 * Nhà tuyển dụng: nhóm kỹ năng → ứng viên, khu vực + kỹ năng (trang Tìm ứng viên chưa đọc
 * tham số URL nên mọi liên kết dẫn về trang đó, chưa lọc sẵn).
 */
export default function ExploreSection() {
  const role = useHomeRole()
  const recruiter = role === 'recruiter'
  const jobs = useAllJobs()
  const candidates = useHomeCandidates()
  const jobCopy = homeSections.explore
  const rcopy = homeSectionsByRole.recruiter.explore

  const { title, unit, labels, tiles, lists } = useMemo(() => {
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
        unit: rcopy.unit,
        labels: [rcopy.districts, rcopy.skills],
        tiles: rcopy.categories.map<Tile>((cat) => ({
          key: cat.key,
          label: cat.label,
          photo: cat.key === 'thu_ngan' ? homeMedia.candidateGroups.thu_ngan : homeMedia.categories[cat.key as keyof typeof homeMedia.categories],
          href: CANDIDATES_HREF,
          count: candidates.filter((c) => c.criteria.skills.some((sk) => norm(sk).includes(cat.skill))).length,
        })),
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
      unit: 'việc',
      labels: [jobCopy.districts, jobCopy.types],
      tiles: jobCopy.categories.map<Tile>((cat) => ({
        key: cat.key,
        label: cat.label,
        photo: homeMedia.categories[cat.key as keyof typeof homeMedia.categories],
        href: toJobs({ ...EMPTY_FILTERS, q: cat.q }),
        count: jobs.filter((j) => jobMatches(j, { ...EMPTY_FILTERS, q: cat.q })).length,
      })),
      lists: [
        DISTRICTS.map<Chip>((d) => ({ key: d, label: d, href: toJobs({ ...EMPTY_FILTERS, district: d }) })),
        types.map<Chip>((t) => ({ key: t.value, label: t.label, href: toJobs({ ...EMPTY_FILTERS, type: t.value }) })),
      ],
    }
  }, [recruiter, jobs, candidates, jobCopy, rcopy])

  return (
    <section data-theme="ivory" className="shell pb-section" aria-labelledby="home-explore-title">
      <TextReveal
        id="home-explore-title"
        text={title}
        className="font-display text-display-sm font-semibold text-page-fg"
      />

      <ul className={cn('mt-8 grid grid-cols-2 gap-3 md:gap-4', recruiter ? 'md:grid-cols-4' : 'md:grid-cols-5')}>
        {tiles.map((tile, i) => (
          <li key={tile.key} className={cn(!recruiter && i === tiles.length - 1 && 'col-span-2 md:col-span-1')}>
            <Link
              to={tile.href}
              data-cursor="Xem"
              className="group relative block aspect-[4/3] overflow-hidden rounded-card bg-wm-graphite md:aspect-[4/5]"
            >
              <img
                src={photoUrl(tile.photo.id, 640)}
                srcSet={photoSrcSet(tile.photo.id)}
                sizes={recruiter ? '(min-width: 768px) 25vw, 50vw' : '(min-width: 768px) 20vw, 50vw'}
                alt={tile.photo.alt}
                width={640}
                height={800}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-editorial
                           group-hover:scale-[1.04] group-focus-visible:scale-[1.04]
                           motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-wm-charcoal/85 via-wm-charcoal/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-wm-ivory">
                <p className="font-display text-xl font-medium leading-tight">{tile.label}</p>
                <p className="mt-1 text-sm text-wm-mist">{tile.count} {unit}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        {lists.map((chips, i) => (
          <div key={labels[i]}>
            <h3 className="eyebrow text-page-muted">{labels[i]}</h3>
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
