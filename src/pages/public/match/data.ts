// DỮ LIỆU MẪU cho /match — thay bằng API khi có backend.
// Công ty lấy từ COMPANIES (/viec-lam), hồ sơ người tìm việc từ PROFILE_DEFAULT,
// vị trí của doanh nghiệp từ MOCK_JOBS j1–j4 (bổ sung yêu cầu chấm điểm ở đây, không sửa mockData).
// Ca làm là khóa `${ngày 0–6}-${buổi 0–2}` (T2…CN × Sáng/Chiều/Tối); lương quy ra nghìn đồng/giờ.
import { COMPANIES, type DiscoverCompany } from '@pages/public/jobs/data'
import { AVAILABILITY_DEFAULT, PROFILE_DEFAULT } from '@pages/jobseeker/mockData'
import { MOCK_JOBS, type MockJob } from '@pages/recruiter/mockData'
import type { Photo } from '@components/discover/types'
import { COMPANY } from '@pages/public/personal/companyData'
import { ME } from '@services/connectionService'
import type { JobType } from '@/types'
import type { JobRequirement, SeekerCriteria } from './score'

/** Tạo danh sách khóa ca từ các ngày và buổi */
const slots = (days: number[], sessions: number[]) => days.flatMap((d) => sessions.map((s) => `${d}-${s}`))
const WEEKDAYS = [0, 1, 2, 3, 4]

// ─── Phía người tìm việc ────────────────────────────────────────────────────

/** Tiêu chí mặc định lấy từ hồ sơ mẫu */
export const SEEKER_DEFAULT: SeekerCriteria = {
  skills: PROFILE_DEFAULT.skills,
  slots: AVAILABILITY_DEFAULT,
  salaryMinK: PROFILE_DEFAULT.salaryMin / 1000,
  maxDistanceKm: PROFILE_DEFAULT.maxDistanceKm,
  jobTypes: PROFILE_DEFAULT.jobTypes,
}

export interface MatchJob extends JobRequirement {
  id: string
  companyId: string
  title: string
  district: string
  /** Cách nơi ở của hồ sơ mẫu */
  distanceKm: number
  salaryLabel: string
  shiftLabel: string
  /** Ảnh minh họa theo từng vị trí (không theo công ty) */
  photo: Photo
}

export const MATCH_JOBS: MatchJob[] = [
  { id: 'm1', companyId: 'gio-song-han', title: 'Pha chế ca tối', district: 'Sơn Trà', distanceKm: 3.2, salaryLabel: '28.000–32.000đ/giờ', shiftLabel: 'Tối T2–T6',
    skills: ['Pha chế cơ bản', 'Giao tiếp khách hàng'], slots: slots(WEEKDAYS, [2]), salaryMinK: 28, salaryMaxK: 32, jobType: 'part-time',
    photo: { id: '1442512595331-e89e73853f31', alt: 'Tay rót nước nóng qua phễu lọc cà phê, bình rót cổ ngỗng bên cạnh' } },
  { id: 'm2', companyId: 'gio-song-han', title: 'Thu ngân cuối tuần', district: 'Sơn Trà', distanceKm: 3.5, salaryLabel: '26.000–28.000đ/giờ', shiftLabel: 'Sáng, chiều T7–CN',
    skills: ['Thu ngân', 'Excel'], slots: slots([5, 6], [0, 1]), salaryMinK: 26, salaryMaxK: 28, jobType: 'part-time',
    photo: { id: '1556745757-8d76bdb6984b', alt: 'Bàn tay đặt thẻ lên máy thanh toán ở quầy thu ngân' } },
  { id: 'm3', companyId: 'bien-xanh', title: 'Bán hàng cuối tuần', district: 'Hải Châu', distanceKm: 1.5, salaryLabel: '25.000–28.000đ/giờ', shiftLabel: 'Sáng, chiều T7–CN',
    skills: ['Giao tiếp khách hàng', 'Bán hàng'], slots: slots([5, 6], [0, 1]), salaryMinK: 25, salaryMaxK: 28, jobType: 'part-time',
    photo: { id: '1441986300917-64674bd600d8', alt: 'Cửa hàng quần áo với kệ gỗ và đèn treo' } },
  { id: 'm4', companyId: 'bien-xanh', title: 'Kiểm kho ban đêm', district: 'Hải Châu', distanceKm: 2.0, salaryLabel: '22.000–24.000đ/giờ', shiftLabel: 'Tối T7–CN',
    skills: ['Kiểm kho', 'Excel'], slots: slots([5, 6], [2]), salaryMinK: 22, salaryMaxK: 24, jobType: 'shift',
    photo: { id: '1586528116311-ad8dd3c8310d', alt: 'Kho hàng với các kệ cao xếp đầy thùng hàng' } },
  { id: 'm5', companyId: 'may-trang', title: 'Phục vụ tiệc cưới', district: 'Thanh Khê', distanceKm: 4.1, salaryLabel: '350.000đ/ngày', shiftLabel: 'Tối T7',
    skills: ['Giao tiếp khách hàng', 'Phục vụ bàn'], slots: slots([5], [2]), salaryMinK: 40, salaryMaxK: 45, jobType: 'event',
    photo: { id: '1511795409834-ef04bbd61622', alt: 'Bàn tiệc dài trang trí hoa và ly thủy tinh' } },
  { id: 'm6', companyId: 'may-trang', title: 'Điều phối viên sự kiện', district: 'Thanh Khê', distanceKm: 4.5, salaryLabel: '30.000–35.000đ/giờ', shiftLabel: 'Sáng, chiều T7–CN',
    skills: ['Giao tiếp khách hàng', 'Excel', 'Tiếng Anh giao tiếp', 'Điều phối nhóm'], slots: slots([5, 6], [0, 1]), salaryMinK: 30, salaryMaxK: 35, jobType: 'event',
    photo: { id: '1492684223066-81342ee5ff30', alt: 'Giấy kim tuyến bay trong ánh đèn sân khấu' } },
  { id: 'm7', companyId: 'canh-buom', title: 'Trợ lý nội dung', district: 'Hải Châu', distanceKm: 1.0, salaryLabel: '27.000–32.000đ/giờ', shiftLabel: 'Sáng, chiều T3, T5',
    skills: ['Viết nội dung', 'Canva', 'Thiết kế'], slots: slots([1, 3], [0, 1]), salaryMinK: 27, salaryMaxK: 32, jobType: 'freelance',
    photo: { id: '1455390582262-044cdead277a', alt: 'Ngòi bút máy đang viết trên trang giấy' } },
  { id: 'm8', companyId: 'canh-buom', title: 'Hỗ trợ hành chính', district: 'Hải Châu', distanceKm: 1.2, salaryLabel: '25.000–27.000đ/giờ', shiftLabel: 'Tối T4–T7',
    skills: ['Excel', 'Giao tiếp khách hàng'], slots: slots([2, 3, 4, 5], [2]), salaryMinK: 25, salaryMaxK: 27, jobType: 'part-time',
    photo: { id: '1497366811353-6870744d04b2', alt: 'Văn phòng trống với bàn họp dài và cửa kính' } },
  { id: 'm9', companyId: 'giao-nhanh', title: 'Giao hàng nội thành', district: 'Cẩm Lệ', distanceKm: 7.5, salaryLabel: '22.000–30.000đ/giờ', shiftLabel: 'Tối T2, T3',
    skills: ['Lái xe máy', 'Biết đường Đà Nẵng'], slots: slots([0, 1], [2]), salaryMinK: 22, salaryMaxK: 30, jobType: 'freelance',
    photo: { id: '1526367790999-0150786686a2', alt: 'Người giao hàng đạp xe với thùng hàng sau lưng trên phố nhỏ' } },
  { id: 'm10', companyId: 'hoa-sua', title: 'Trợ giảng tiếng Anh', district: 'Ngũ Hành Sơn', distanceKm: 8.8, salaryLabel: '35.000–40.000đ/giờ', shiftLabel: 'Tối T3, T5',
    skills: ['Tiếng Anh giao tiếp', 'Giao tiếp khách hàng', 'Sư phạm'], slots: slots([1, 3], [2]), salaryMinK: 35, salaryMaxK: 40, jobType: 'part-time',
    photo: { id: '1503676260728-1c00da094a0b', alt: 'Quả táo đặt trên chồng sách cạnh những cây bút màu' } },
  { id: 'm11', companyId: 'hoa-sua', title: 'Lễ tân trung tâm', district: 'Ngũ Hành Sơn', distanceKm: 8.6, salaryLabel: '24.000–26.000đ/giờ', shiftLabel: 'Tối T2, T4, T6',
    skills: ['Giao tiếp khách hàng', 'Excel'], slots: slots([0, 2, 4], [2]), salaryMinK: 24, salaryMaxK: 26, jobType: 'full-time',
    photo: { id: '1497366754035-f200968a6e72', alt: 'Hành lang văn phòng vách kính sáng sủa' } },
  { id: 'm12', companyId: 'song-vo', title: 'Phục vụ nhà hàng ca tối', district: 'Sơn Trà', distanceKm: 4.6, salaryLabel: '24.000–27.000đ/giờ', shiftLabel: 'Tối T6–CN',
    skills: ['Phục vụ bàn', 'Giao tiếp khách hàng'], slots: slots([4, 5, 6], [2]), salaryMinK: 24, salaryMaxK: 27, jobType: 'shift',
    photo: { id: '1517248135467-4c7edcad34c4', alt: 'Phòng ăn nhà hàng với bàn gỗ và đèn vàng' } },
  { id: 'm13', companyId: 'song-vo', title: 'Phụ bếp cuối tuần', district: 'Sơn Trà', distanceKm: 4.8, salaryLabel: '22.000–25.000đ/giờ', shiftLabel: 'Sáng, chiều T7–CN',
    skills: ['Sơ chế thực phẩm', 'An toàn thực phẩm'], slots: slots([5, 6], [0, 1]), salaryMinK: 22, salaryMaxK: 25, jobType: 'part-time',
    photo: { id: '1466637574441-749b8f19452f', alt: 'Dao và rau củ xếp trên thớt gỗ, trứng và nấm bên cạnh' } },
]

/** Công ty của doanh nghiệp demo (admin2) — tin j1–j4 của họ hiện cho người tìm việc ở /match */
export const DEMO_COMPANY: DiscoverCompany = {
  id: 'song-han',
  name: COMPANY.name,
  industry: COMPANY.industry,
  district: 'Hải Châu',
  size: '11-50',
  cover: { id: '1554118811-1e0d58224f24', alt: 'Không gian quán cà phê nhiều cây xanh, quầy pha chế phía sau' },
  tagline: 'Quán cà phê, cửa hàng tiện lợi và tiệc cưới quanh trung tâm.',
  why: 'Nhiều ca và nhiều loại việc để chọn.',
  about: COMPANY.intro,
  environment: COMPANY.environment,
}

export function companyOf(id: string): DiscoverCompany {
  if (id === DEMO_COMPANY.id) return DEMO_COMPANY
  // Dữ liệu mẫu luôn khớp COMPANIES; nếu lệch thì báo lỗi sớm để dễ thấy
  const c = COMPANIES.find((x) => x.id === id)
  if (!c) throw new Error(`Không có công ty mẫu "${id}"`)
  return c
}

// ─── Phía doanh nghiệp ──────────────────────────────────────────────────────

export interface MatchPosition {
  id: string
  job: MockJob
  req: JobRequirement
  radiusKm: number
}

/** Yêu cầu chấm điểm cho các tin j1–j4 (khớp lịch/lương ghi trong MOCK_JOBS) */
const POSITION_REQ: Record<string, JobRequirement> = {
  j1: { skills: ['Pha chế cơ bản', 'Giao tiếp khách hàng'], slots: slots([0, 1, 2, 3, 4, 5], [2]), salaryMinK: 30, salaryMaxK: 32, jobType: 'shift' },
  j2: { skills: ['Bán hàng', 'Giao tiếp khách hàng'], slots: slots([5, 6], [0, 1]), salaryMinK: 28, salaryMaxK: 30, jobType: 'part-time' },
  j3: { skills: ['Phục vụ bàn', 'Giao tiếp khách hàng'], slots: slots([5], [2]), salaryMinK: 40, salaryMaxK: 45, jobType: 'event' },
  j4: { skills: ['Thu ngân', 'Excel'], slots: ['0-0', '1-1', '2-2', '3-0', '4-1', '5-2'], salaryMinK: 34, salaryMaxK: 38, jobType: 'full-time' },
}

export const POSITIONS: MatchPosition[] = MOCK_JOBS.filter((j) => j.id in POSITION_REQ).map((job) => ({
  id: job.id,
  job,
  req: POSITION_REQ[job.id],
  radiusKm: 8,
}))

/** Ảnh và khoảng cách cho các tin j1–j4 khi hiện ở phía người tìm việc */
const POSITION_JOB_EXTRA: Record<string, { distanceKm: number; photo: Photo }> = {
  j1: { distanceKm: 1.6, photo: { id: '1501339847302-ac426a4a7cbb', alt: 'Biển hiệu chữ CAFE phát sáng trong quán' } },
  j2: { distanceKm: 2.2, photo: { id: '1441986300917-64674bd600d8', alt: 'Cửa hàng quần áo với kệ gỗ và đèn treo' } },
  j3: { distanceKm: 3.0, photo: { id: '1414235077428-338989a2e8c0', alt: 'Món ăn trình bày trên đĩa trắng giữa bàn tiệc' } },
  j4: { distanceKm: 1.2, photo: { id: '1604719312566-8912e9227c6a', alt: 'Lối đi giữa các kệ hàng trong cửa hàng tiện lợi' } },
}

/** Tin của doanh nghiệp demo nhìn từ phía người tìm việc (id trùng id vị trí để hai phía chung một cặp) */
export const RECRUITER_POSITION_JOBS: MatchJob[] = POSITIONS.map((p) => ({
  ...p.req,
  id: p.id,
  companyId: DEMO_COMPANY.id,
  title: p.job.title,
  district: 'Hải Châu',
  distanceKm: POSITION_JOB_EXTRA[p.id].distanceKm,
  salaryLabel: p.job.salary,
  shiftLabel: p.job.schedule,
  photo: POSITION_JOB_EXTRA[p.id].photo,
}))

/** Mọi việc người tìm việc thấy ở /match */
export const SEEKER_JOBS: MatchJob[] = [...MATCH_JOBS, ...RECRUITER_POSITION_JOBS]

export type Availability = { kind: 'ready'; from: string } | { kind: 'working' }

export interface MatchCandidate {
  id: string
  positionId: string
  /** Tên viết tắt — liên hệ chỉ mở sau khi hai bên MATCH */
  name: string
  area: string
  distanceKm: number
  summary: string
  availability: Availability
  criteria: SeekerCriteria
  /** Ảnh minh họa không lộ mặt: tay, dụng cụ, góc làm việc hợp nghề của ứng viên */
  photo: Photo
}

const ready = (from: string): Availability => ({ kind: 'ready', from })
const WORKING: Availability = { kind: 'working' }

/** Rút gọn khai báo ứng viên: bán kính mong muốn mặc định 8 km */
function cand(
  id: string, positionId: string, name: string, area: string, distanceKm: number, summary: string,
  availability: Availability, skills: string[], slotKeys: string[], salaryMinK: number, jobTypes: JobType[], photo: Photo,
): MatchCandidate {
  return { id, positionId, name, area, distanceKm, summary, availability, criteria: { skills, slots: slotKeys, salaryMinK, maxDistanceKm: 8, jobTypes }, photo }
}

export const CANDIDATES: MatchCandidate[] = [
  // j1 — pha chế ca tối
  cand('u1', 'j1', 'Nguyễn T. H.', 'Hải Châu', 1.8, 'Pha chế · 2 năm làm quán', ready('01/12'),
    ['Pha chế cơ bản', 'Giao tiếp khách hàng', 'Barista'], slots([0, 1, 2, 3, 4, 5], [2]), 28, ['shift', 'part-time'], { id: '1511920170033-f8396924c348', alt: 'Tay cầm lọc của máy pha espresso đựng cà phê xay, bên cạnh ly latte' }),
  cand('u2', 'j1', 'Trần M. K.', 'Thanh Khê', 3.2, 'Pha chế, thu ngân · 1 năm', ready('05/12'),
    ['Pha chế cơ bản', 'Thu ngân'], slots([0, 1, 2, 3, 4], [2]), 30, ['shift'], { id: '1495474472287-4d71bcdd2085', alt: 'Hai bàn tay cầm hai ly latte có hình lá trên bàn gỗ' }),
  cand('u3', 'j1', 'Lê Q. A.', 'Sơn Trà', 5.6, 'Phục vụ · sinh viên năm 3', WORKING,
    ['Giao tiếp khách hàng', 'Phục vụ bàn'], slots([0, 1, 2, 3], [2]), 35, ['part-time'], { id: '1414235077428-338989a2e8c0', alt: 'Món ăn trình bày trên đĩa trắng giữa bàn phục vụ' }),
  cand('u4', 'j1', 'Phạm T. B.', 'Liên Chiểu', 11.4, 'Pha chế · mới ra trường', ready('10/12'),
    ['Pha chế cơ bản'], ['4-2', '5-2'], 35, ['full-time'], { id: '1447933601403-0c6688de566e', alt: 'Hạt cà phê rang phủ kín mặt ảnh' }),
  cand('u5', 'j1', 'Hồ N. Y.', 'Hải Châu', 2.4, 'Giao tiếp · 6 tháng phục vụ cà phê', ready('01/12'),
    ['Giao tiếp khách hàng', 'Phục vụ bàn'], slots([0, 1, 2, 3, 4, 5], [2]), 30, ['shift', 'part-time'], { id: '1509042239860-f550ce710b93', alt: 'Ba tách latte trên bàn gỗ cạnh chậu cây' }),
  // j2 — bán hàng cuối tuần
  cand('u6', 'j2', 'Võ H. N.', 'Hải Châu', 2.1, 'Bán hàng · 1 năm ở cửa hàng quần áo', ready('01/12'),
    ['Bán hàng', 'Giao tiếp khách hàng'], slots([5, 6], [0, 1]), 28, ['part-time'], { id: '1558769132-cb1aea458c5e', alt: 'Quần áo len treo trên giá gỗ sáng màu' }),
  cand('u7', 'j2', 'Đặng L. T.', 'Ngũ Hành Sơn', 6.3, 'Bán hàng · tiếng Anh giao tiếp', ready('15/12'),
    ['Bán hàng', 'Tiếng Anh giao tiếp'], ['5-0', '5-1', '6-0'], 30, ['part-time', 'flexible'], { id: '1456513080510-7bf3a84b82f8', alt: 'Cuốn sách mở trên bàn, giá sách phía sau' }),
  cand('u8', 'j2', 'Bùi A. Đ.', 'Cẩm Lệ', 7.9, 'Bán hàng · mới bắt đầu', WORKING,
    ['Bán hàng'], ['5-0', '6-1'], 32, ['part-time'], { id: '1472851294608-062f824d29cc', alt: 'Bảng OPEN treo trước cửa tiệm' }),
  cand('u9', 'j2', 'Mai P. T.', 'Thanh Khê', 3.6, 'Thu ngân · sinh viên, rảnh cuối tuần', ready('01/12'),
    ['Giao tiếp khách hàng', 'Thu ngân'], slots([5, 6], [0, 1]), 26, ['part-time', 'event'], { id: '1556745757-8d76bdb6984b', alt: 'Bàn tay đặt thẻ lên máy thanh toán ở quầy thu ngân' }),
  cand('u10', 'j2', 'Cao V. S.', 'Sơn Trà', 9.8, 'Chăm sóc khách hàng · 6 tháng', ready('20/12'),
    ['Giao tiếp khách hàng'], ['5-0', '6-0'], 30, ['full-time'], { id: '1517842645767-c639042777db', alt: 'Cuốn sổ tay và cây bút đặt trên bàn' }),
  // j3 — phục vụ tiệc cưới
  cand('u11', 'j3', 'Hoàng M. P.', 'Thanh Khê', 2.7, 'Phục vụ tiệc · 3 sự kiện', ready('01/12'),
    ['Phục vụ bàn', 'Giao tiếp khách hàng'], ['5-2'], 40, ['event', 'part-time'], { id: '1555244162-803834f70033', alt: 'Các khay đồ ăn bày trên bàn tiệc buffet' }),
  cand('u12', 'j3', 'Ngô T. V.', 'Sơn Trà', 4.4, 'Phục vụ · cộng tác viên sự kiện', WORKING,
    ['Phục vụ bàn'], ['5-2'], 50, ['event'], { id: '1511795409834-ef04bbd61622', alt: 'Bàn tiệc dài trang trí hoa và ly thủy tinh' }),
  cand('u13', 'j3', 'Lương B. C.', 'Hải Châu', 3.0, 'Lễ tân · mới làm tiệc', ready('08/12'),
    ['Giao tiếp khách hàng'], ['5-2'], 40, ['event', 'freelance'], { id: '1565688534245-05d6b5be184a', alt: 'Những bàn tay trên tập giấy tờ trong buổi trao đổi' }),
  cand('u14', 'j3', 'Tạ H. M.', 'Liên Chiểu', 12.5, 'Phục vụ nhà hàng · 1 năm', ready('01/12'),
    ['Phục vụ bàn', 'Giao tiếp khách hàng'], ['6-2'], 42, ['event'], { id: '1517248135467-4c7edcad34c4', alt: 'Phòng ăn nhà hàng với bàn gỗ và đèn vàng' }),
  cand('u15', 'j3', 'Đinh Q. K.', 'Cẩm Lệ', 6.0, 'Sinh viên · chưa có kinh nghiệm', ready('01/12'),
    ['Giao tiếp khách hàng'], ['5-2'], 38, ['part-time'], { id: '1434030216411-0b793f4b4173', alt: 'Cánh tay đang viết vào cuốn sổ cạnh cốc sứ' }),
  // j4 — thu ngân
  cand('u16', 'j4', 'Đỗ K. L.', 'Hải Châu', 1.2, 'Thu ngân · 2 năm ở siêu thị', ready('01/12'),
    ['Thu ngân', 'Excel'], ['0-0', '1-1', '2-2', '3-0', '4-1', '5-2'], 34, ['full-time'], { id: '1556745757-8d76bdb6984b', alt: 'Bàn tay đặt thẻ lên máy thanh toán ở quầy thu ngân' }),
  cand('u17', 'j4', 'Phan N. H.', 'Thanh Khê', 2.5, 'Thu ngân · kế toán cơ bản', ready('12/12'),
    ['Thu ngân', 'Excel'], ['0-0', '1-1', '2-2', '3-0', '4-1'], 36, ['full-time', 'shift'], { id: '1488190211105-8b0e65b80b4e', alt: 'Tay ghi chép vào sổ cạnh máy tính, cốc cà phê và kính' }),
  cand('u18', 'j4', 'Vũ T. D.', 'Sơn Trà', 5.2, 'Bán hàng, thu ngân bán thời gian', WORKING,
    ['Thu ngân', 'Bán hàng'], ['0-0', '1-1', '2-2'], 40, ['part-time'], { id: '1558769132-cb1aea458c5e', alt: 'Quần áo len treo trên giá gỗ sáng màu' }),
  cand('u19', 'j4', 'Lâm G. B.', 'Cẩm Lệ', 7.4, 'Tiếng Anh · nhân viên kho', ready('03/12'),
    ['Excel', 'Tiếng Anh giao tiếp'], ['0-0', '1-1', '2-2', '3-0'], 35, ['full-time'], { id: '1586528116311-ad8dd3c8310d', alt: 'Kho hàng với các kệ cao xếp đầy thùng hàng' }),
  cand('u20', 'j4', 'Trịnh M. A.', 'Hải Châu', 3.8, 'Mới tốt nghiệp · muốn việc ổn định', ready('01/12'),
    ['Thu ngân'], ['0-0', '1-1', '2-2', '3-0', '4-1', '5-2'], 34, ['full-time', 'shift'], { id: '1435527173128-983b87201f4d', alt: 'Cuốn sổ lịch mở trên bàn làm việc' }),
]

/** Người tìm việc demo (admin1) — hiện trong danh sách ứng viên của mọi vị trí */
export const ME_CANDIDATE: MatchCandidate = {
  id: ME,
  positionId: '*',
  name: 'Nguyễn M. A.',
  area: 'Hải Châu',
  distanceKm: 1.8,
  summary: 'Phục vụ, sự kiện · 2 năm',
  availability: ready('01/12'),
  criteria: SEEKER_DEFAULT,
  photo: { id: '1517248135467-4c7edcad34c4', alt: 'Phòng ăn nhà hàng với bàn gỗ và đèn vàng' },
}

/** Ứng viên của một vị trí: ứng viên mẫu của vị trí đó + người tìm việc demo */
export const candidatesOf = (positionId: string): MatchCandidate[] => [
  ...CANDIDATES.filter((c) => c.positionId === positionId),
  ME_CANDIDATE,
]
