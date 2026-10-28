import { Link } from 'react-router-dom'
import { MockNotice } from '@components/dashboard'
import { FOCUS } from '@utils/focus'
import { MATCH_JOBS, SEEKER_DEFAULT } from './data'
import { BTN_PRIMARY, BTN_SECONDARY, JobCard, MatchFrame } from './parts'
import { scoreMatch } from './score'

// Ba thẻ mẫu làm nền mờ phía sau lời mời đăng ký (chọn tin có điểm trải rộng)
const PREVIEW = ['m1', 'm3', 'm5']
  .map((id) => MATCH_JOBS.find((j) => j.id === id)!)
  .map((job) => ({ job, outcome: scoreMatch(SEEKER_DEFAULT, job, job.distanceKm) }))

/** Khách: thấy trước kết quả MATCH (mờ) và được mời đăng ký theo vai trò. */
export default function GuestMatch() {
  return (
    <MatchFrame
      title="Việc và người hợp nhau, xếp theo điều bạn coi trọng"
      intro="Kết nối chấm điểm từng cặp việc làm – ứng viên theo kỹ năng, lịch, lương, khoảng cách và loại việc."
    >
      <div className="relative min-h-[34rem] overflow-hidden rounded-card">
        {/* Lớp nền mờ: chỉ để gợi hình dạng kết quả, không tương tác, ẩn với trình đọc màn hình */}
        <div
          aria-hidden="true"
          {...{ inert: '' }}
          className="pointer-events-none flex select-none flex-col gap-4 blur-sm"
        >
          {PREVIEW.map(({ job, outcome }) => (
            <JobCard key={job.id} job={job} outcome={outcome} />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-card border border-page-line bg-page-bg p-6 text-center md:p-8">
            <h2 className="font-display text-2xl font-medium text-page-fg md:text-3xl">
              Tìm công việc hoặc ứng viên phù hợp với bạn chỉ trong vài giây
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-page-muted">
              Đăng ký miễn phí, khai tiêu chí một lần và xem ngay điểm phù hợp cùng lý do cho từng kết quả.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/dang-ky?role=jobseeker" className={BTN_PRIMARY}>
                Tôi tìm việc
              </Link>
              <Link to="/dang-ky?role=recruiter" className={BTN_SECONDARY}>
                Tôi tuyển dụng
              </Link>
            </div>
            <p className="mt-5 text-sm text-page-muted">
              Đã có tài khoản?{' '}
              <Link
                to="/dang-nhap"
                state={{ from: '/match' }}
                className={`rounded-control font-medium text-page-fg underline underline-offset-4 ${FOCUS}`}
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <MockNotice />
      </div>
    </MatchFrame>
  )
}
