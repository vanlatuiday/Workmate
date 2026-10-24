import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import { Facts, PrimaryLink, TextLink } from '@components/discover/parts'
import { findCompany, jobsOf } from './jobs/data'

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'
const EASE = [0.22, 1, 0.36, 1] as const

/** /cong-ty/:id — chi tiết một công ty trong bộ sưu tập /viec-lam (dữ liệu mẫu). */
export default function CompanyDetailPage() {
  const { id } = useParams()
  const company = findCompany(id)
  const role = useAuthStore((s) => s.user?.role)
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  // Đến từ /viec-lam → quay lại bằng lịch sử để giữ đúng chỗ đang xem trong bộ sưu tập
  const fromGallery = (location.state as { from?: string } | null)?.from === '/viec-lam'

  const back = fromGallery ? (
    <button type="button" onClick={() => navigate(-1)} className={backClass}>
      <ArrowLeft className="h-4 w-4" />
      Quay lại khám phá
    </button>
  ) : (
    <Link to="/viec-lam" className={backClass}>
      <ArrowLeft className="h-4 w-4" />
      Khám phá các công ty
    </Link>
  )

  if (!company) {
    return (
      <section className="shell min-h-[60vh] py-section-sm">
        {back}
        <h1 className="mt-10 font-display text-display-sm font-semibold">Không tìm thấy công ty</h1>
        <p className="mt-4 max-w-xl text-page-muted">Công ty này không có trong dữ liệu mẫu hoặc đường dẫn đã thay đổi.</p>
      </section>
    )
  }

  const jobs = jobsOf(company)
  const enter = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay },
        }

  return (
    <article className="pb-section-sm">
      <header className="shell pt-10 md:pt-14">
        {back}
        <motion.div {...enter()} className="mt-10 grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="eyebrow text-page-muted">
              <span className="h-px w-8 bg-page-line" />
              {company.industry} · {company.district}
            </p>
            <h1 className="mt-5 max-w-[16ch] font-display text-display-md font-semibold">{company.name}</h1>
          </div>
          <p className="max-w-md leading-relaxed text-page-muted md:col-span-4">{company.tagline}</p>
        </motion.div>
      </header>

      {/* Ảnh bìa — nở nhẹ khi vào trang, nối mạch với ảnh vừa bấm ở bộ sưu tập */}
      <div className="shell mt-10 md:mt-14">
        <div className="overflow-hidden rounded-control bg-page-surface">
          <motion.img
            src={photoUrl(company.cover.id, 1400)}
            srcSet={photoSrcSet(company.cover.id)}
            sizes="(min-width: 1440px) 1312px, 92vw"
            alt={company.cover.alt}
            className="aspect-[4/3] w-full object-cover md:aspect-[21/9]"
            {...(reduced
              ? {}
              : {
                  initial: { scale: 1.08, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  transition: { duration: 1, ease: EASE },
                })}
          />
        </div>
      </div>

      <div className="shell mt-14 grid gap-12 md:mt-20 lg:grid-cols-12">
        <motion.section {...enter(0.1)} className="lg:col-span-7">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Giới thiệu</h2>
          <p className="mt-4 text-lg leading-relaxed">{company.about}</p>
          <h3 className="mt-10 text-xs font-medium uppercase tracking-[0.18em] text-page-muted">Môi trường làm việc</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {company.environment.map((e) => (
              <li key={e} className="rounded-full border border-page-line px-3 py-1.5 text-sm text-page-muted">
                {e}
              </li>
            ))}
          </ul>
        </motion.section>
        <aside className="lg:col-span-4 lg:col-start-9">
          <Facts
            rows={[
              ['Lĩnh vực', company.industry],
              ['Địa điểm', `${company.district}, Đà Nẵng`],
              ['Quy mô', `${company.size} người`],
              ['Đang tuyển', `${jobs.length} vị trí`],
            ]}
          />
        </aside>
      </div>

      {company.more && (
        <div className="shell mt-14 md:mt-20">
          <img
            src={photoUrl(company.more.id, 1400)}
            srcSet={photoSrcSet(company.more.id)}
            sizes="(min-width: 1024px) 60vw, 92vw"
            alt={company.more.alt}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full rounded-control object-cover lg:ml-auto lg:w-7/12"
          />
        </div>
      )}

      <section className="shell mt-16 md:mt-24">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">Việc đang tuyển</h2>
        {jobs.length ? (
          <ul className="mt-6 divide-y divide-page-line border-y border-page-line">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  to={`/viec-lam/${j.id}`}
                  className={`group flex items-center justify-between gap-6 rounded-control py-5 ${FOCUS}`}
                >
                  <span>
                    <span className="block font-display text-xl font-medium">{j.title}</span>
                    <span className="mt-1 block text-sm text-page-muted">
                      {j.salaryLabel} · {j.shift} · {j.district}
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform duration-500 ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-page-muted">Hiện chưa có tin đang mở.</p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          {!role && <PrimaryLink to="/dang-ky?role=jobseeker">Đăng ký để ứng tuyển</PrimaryLink>}
          {role === 'jobseeker' && <PrimaryLink to="/tim-viec/phu-hop">Xem việc phù hợp với tôi</PrimaryLink>}
          <TextLink to="/viec-lam">Xem các công ty khác</TextLink>
        </div>
        <p className="mt-10 text-xs text-page-muted">Thông tin công ty và tin tuyển dụng là dữ liệu mẫu. Ảnh minh họa từ Unsplash.</p>
      </section>
    </article>
  )
}

const backClass = `inline-flex items-center gap-2 rounded-control text-sm text-page-muted transition-colors duration-300 hover:text-page-fg ${FOCUS}`
