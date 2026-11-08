// DỮ LIỆU MẪU BAN ĐẦU/DỰ PHÒNG cho `catalogStore` — chỉ để lần vẽ đầu có nội dung và web vẫn chạy khi máy
// chủ tắt. Khi `catalogStore.load()` thành công, toàn bộ được thay bằng dữ liệu thật từ API.
// Import file này đầu tiên ở main.tsx (chạy trước mọi trang). Đứng riêng khỏi catalogStore để store không
// import dữ liệu mẫu (tránh vòng import với `companyOf` ở match/data).
import { useCatalogStore, type CatalogCompany, type CatalogJob } from './catalogStore'
import { DEMO_COMPANY, RECRUITER_POSITION_JOBS, MATCH_JOBS } from '@pages/public/match/data'
import { COMPANIES } from '@pages/public/jobs/data'
import { MOCK_JOBS } from '@pages/recruiter/mockData'

const VERIFIED = new Set(['gio-song-han', 'bien-xanh', 'may-trang', 'hoa-sua'])
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
/** "dd/mm/yyyy" → ISO; không đọc được thì lấy hiện tại */
const dmy = (s?: string) => {
  const m = s ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s) : null
  return m ? `${m[3]}-${m[2]}-${m[1]}T00:00:00.000Z` : new Date().toISOString()
}

const companies: CatalogCompany[] = [...COMPANIES, DEMO_COMPANY].map((c) => ({ ...c, verified: VERIFIED.has(c.id), locked: false }))

const base = { description: '', quantity: 1, radiusKm: 8 }
const jobs: CatalogJob[] = [
  ...MATCH_JOBS.map((j) => ({ ...j, ...base, postedAt: ago(60 * 24 * 20), status: 'open' as const, moderation: 'approved' as const, visible: true })),
  ...RECRUITER_POSITION_JOBS.map((j) => {
    const mock = MOCK_JOBS.find((m) => m.id === j.id)
    const status = mock?.status === 'paused' || mock?.status === 'closed' ? mock.status : ('open' as const)
    return { ...j, ...base, postedAt: dmy(mock?.postedAt), status, moderation: 'approved' as const, visible: status === 'open' }
  }),
  // Ba tin mẫu đang chờ duyệt — một tin bình thường, hai tin bị gắn cờ, để hàng chờ không trống
  ...(() => {
    const p = { companyId: 'song-han', district: 'Hải Châu', distanceKm: 2.0, radiusKm: 8, quantity: 2, status: 'open' as const, moderation: 'pending' as const, visible: false }
    return [
      { ...p, id: 'p-seed-1', title: 'Phụ quầy cà phê buổi sáng', salaryLabel: '27.000–30.000đ/giờ', shiftLabel: 'Sáng T2–T6',
        skills: ['Pha chế cơ bản', 'Giao tiếp khách hàng'], slots: ['0-0', '1-0', '2-0', '3-0', '4-0'], salaryMinK: 27, salaryMaxK: 30, jobType: 'part-time' as const,
        photo: { id: '1442512595331-e89e73853f31', alt: 'Pha cà phê bằng phễu lọc' },
        description: 'Hỗ trợ quầy pha chế giờ cao điểm buổi sáng, được hướng dẫn từ đầu.', postedAt: ago(40) },
      { ...p, id: 'p-seed-2', title: 'Cộng tác viên bán hàng online tại nhà', salaryLabel: '15.000đ/giờ', shiftLabel: 'Linh hoạt',
        skills: [], slots: [], salaryMinK: 15, salaryMaxK: 15, jobType: 'freelance' as const,
        photo: { id: '1497366811353-6870744d04b2', alt: 'Văn phòng trống với bàn họp dài' },
        description: 'Việc nhẹ lương cao, chỉ cần đặt cọc 200.000đ để nhận hàng mẫu.', postedAt: ago(25) },
      { ...p, id: 'p-seed-3', title: 'Phục vụ tiệc cuối tuần', salaryLabel: '350.000đ/ngày', shiftLabel: 'Tối T7, CN',
        skills: ['Phục vụ bàn'], slots: ['5-2', '6-2'], salaryMinK: 40, salaryMaxK: 45, jobType: 'event' as const,
        photo: { id: '1511795409834-ef04bbd61622', alt: 'Bàn tiệc dài trang trí hoa' },
        description: '', postedAt: ago(10) },
    ]
  })(),
]

useCatalogStore.setState({ companies, jobs })
