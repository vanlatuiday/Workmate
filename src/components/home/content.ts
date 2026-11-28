import heroSkylineImg from '@assets/images/home/hero-skyline.webp'
import heroArtCalendar from '@assets/images/home/hero-art-calendar.webp'
import heroArtBriefcase from '@assets/images/home/hero-art-briefcase.webp'
/** Nội dung trang chủ — sửa tại đây, không cần đụng vào các component. */

export const heroTags = ['Pha chế', 'Bán hàng', 'Marketing', 'Giao hàng', 'Phục vụ']

export const benefits = [
  {
    title: 'Chỉ gợi ý ca nằm trong giờ bạn rảnh.',
    body: 'Nhập giờ học, giờ làm hiện tại. Chỉ những ca khớp với bạn mới được đề xuất.',
  },
  {
    title: 'Gần nhà, đúng quãng đường bạn muốn đi.',
    body: 'Đặt bán kính di chuyển một lần, Workmate lọc phần còn lại.',
  },
  {
    title: 'Chỉ kết nối khi cả hai bên cùng muốn.',
    body: 'Ứng viên và nhà tuyển dụng cùng quan tâm thì kênh trò chuyện riêng mới mở ra.',
  },
]

export const steps = [
  { title: 'Tạo hồ sơ trong 5 phút', body: 'Kỹ năng, khu vực và lịch rảnh trong tuần là đủ.' },
  { title: 'Nhận gợi ý vừa khít', body: 'Mỗi việc làm kèm điểm phù hợp và lý do vì sao nó hợp với bạn.' },
  { title: 'Kết nối rồi mới trò chuyện', body: 'Hai bên cùng quan tâm thì kênh chat riêng mở ra, hẹn phỏng vấn ngay trong đó.' },
]

/** Lời mở đầu trang chủ theo người đang xem. Khách: trung lập cho cả hai phía.
    `search` = hiện ô tìm việc; `actions` = các nút thay cho ô tìm việc. */
type HeroCopy = {
  title: string
  /** Tiêu đề tách hai dòng lớn (ghép lại phải ra đúng `title`). */
  titleLines: [string, string]
  lead: string
  search: boolean
  actions: { label: string; href: string }[]
}

export const heroCopy: Record<'guest' | 'jobseeker' | 'recruiter' | 'admin', HeroCopy> = {
  guest: {
    title: 'Bạn đang cần gì hôm nay?',
    titleLines: ['Bạn đang cần gì', 'hôm nay?'],
    lead: 'Tìm việc theo ca ở Đà Nẵng, phù hợp lịch rảnh của bạn.',
    search: true,
    actions: [{ label: 'Đăng tin tuyển người', href: '/dang-ky?role=recruiter' }],
  },
  jobseeker: {
    title: 'Hôm nay bạn muốn làm việc gì?',
    titleLines: ['Hôm nay bạn muốn', 'làm việc gì?'],
    lead: 'Gợi ý việc ở Đà Nẵng theo lịch rảnh, khu vực và kỹ năng của bạn.',
    search: true,
    actions: [],
  },
  recruiter: {
    title: 'Bạn đang thiếu vị trí nào?',
    titleLines: ['Bạn đang thiếu', 'vị trí nào?'],
    lead: 'Đăng ca tại Đà Nẵng, nhận gợi ý ứng viên theo lịch rảnh và kỹ năng.',
    search: false,
    actions: [
      { label: 'Đăng tin tuyển dụng', href: '/dang-tin' },
      { label: 'Xem ứng viên phù hợp', href: '/tuyen-dung/ung-vien-phu-hop' },
    ],
  },
  admin: {
    title: 'Hôm nay cần xử lý gì?',
    titleLines: ['Hôm nay cần', 'xử lý gì?'],
    lead: 'Hồ sơ doanh nghiệp chờ xác minh, tin cần kiểm duyệt và người dùng mới.',
    search: false,
    actions: [
      { label: 'Xác minh doanh nghiệp', href: '/admin/xac-minh' },
      { label: 'Vào khu quản trị', href: '/admin' },
    ],
  },
}

/* ── Nội dung giữa trang chủ theo người đang xem ───────────────────────────
   Khách (và admin): trung lập, nói cho cả hai phía. Ứng viên / nhà tuyển dụng: nói với đúng vai trò. */

/* ── Các section bên dưới hero (trang chủ kiểu "ảnh + khối + hàng thẻ") ───────
   Ảnh đi kèm nằm ở homeMedia.ts. Toàn bộ là nội dung mẫu, thay tại đây. */

export const homeSections = {
  /** Chú thích gắn ở các hàng thẻ việc làm */
  sampleNote: 'Dữ liệu minh họa',
  /** Phần câu nhấn giữa trang (StatementSection): nhãn, tiêu đề (đoạn nhấn màu cyan ở giữa), mô tả và nút theo vai trò */
  statementEyebrow: { lead: 'Kết nối cơ hội', tail: 'Kiến tạo tương lai' },
  statementTitle: { lead: 'Ghép việc hợp lịch, kết nối khi ', em: 'cả hai bên', tail: ' cùng muốn.' },
  statementSub: {
    guest: 'Xem ca đang tuyển, chọn nơi làm và ứng tuyển khi bạn sẵn sàng.',
    jobseeker: 'Xem ca đang tuyển, chọn nơi làm và ứng tuyển khi bạn sẵn sàng.',
    recruiter: 'Đăng ca dễ dàng, gặp đúng người rảnh đúng ca, kết nối khi cả hai cùng muốn.',
  },
  statementButtons: {
    guest: { primary: { label: 'Tìm việc ngay', href: '/viec-lam' }, secondary: { label: 'Đăng tuyển ngay', href: '/dang-ky?role=recruiter' } },
    jobseeker: { primary: { label: 'Tìm việc ngay', href: '/viec-lam' }, secondary: { label: 'Sửa lịch rảnh', href: '/ho-so#lich-ranh' } },
    recruiter: { primary: { label: 'Đăng tuyển ngay', href: '/dang-tin' }, secondary: { label: 'Xem ứng viên phù hợp', href: '/match' } },
  },
  statementDeskAlt: 'Bàn làm việc với laptop, cây xanh, ly cà phê và sổ tay',
  statementChip: { suffix: 'ca đang tuyển', line2: 'tuần này' },
  /** 3 tiêu chí bên phải (StatementSection) */
  statementCriteria: {
    guest: [
      { key: 'lich', title: 'Lịch rảnh', body: 'Chọn các buổi bạn đi làm được trong tuần.', cta: { label: 'Khai lịch rảnh', href: '/dang-ky?role=jobseeker' } },
      { key: 'duong', title: 'Quãng đường', body: 'Đặt khoảng cách tối đa từ nhà tới chỗ làm.', cta: { label: 'Đặt quãng đường', href: '/dang-ky?role=jobseeker' } },
      { key: 'ketnoi', title: 'Kết nối', body: 'Hai bên cùng quan tâm thì kênh chat riêng mới mở.', cta: { label: 'Xem cách kết nối', href: '/match' } },
    ],
    jobseeker: [
      { key: 'lich', title: 'Lịch rảnh', body: 'Cập nhật buổi rảnh để gợi ý luôn khớp lịch.', cta: { label: 'Sửa lịch rảnh', href: '/ho-so#lich-ranh' } },
      { key: 'duong', title: 'Quãng đường', body: 'Đổi khu vực và khoảng cách bạn muốn đi làm.', cta: { label: 'Sửa quãng đường', href: '/ho-so#mong-muon' } },
      { key: 'ketnoi', title: 'Kết nối', body: 'Nhà tuyển dụng đồng ý thì kênh chat với bạn mở ra.', cta: { label: 'Xem việc đã ứng tuyển', href: '/match' } },
    ],
    recruiter: [
      { key: 'lich', title: 'Ca làm', body: 'Khai đúng ca cần người, Workmate tìm người rảnh ca đó.', cta: { label: 'Khai ca làm', href: '/dang-tin' } },
      { key: 'duong', title: 'Khu vực', body: 'Ứng viên được gợi ý theo quãng đường tới cửa hàng.', cta: { label: 'Chọn khu vực tuyển', href: '/dang-tin' } },
      { key: 'ketnoi', title: 'Kết nối', body: 'Quan tâm ứng viên, hai bên đồng ý thì chat mở.', cta: { label: 'Xem ứng viên phù hợp', href: '/match' } },
    ],
  },
  urgent: { title: 'Việc đang tuyển gấp', all: { label: 'Xem việc tuyển gấp', href: '/viec-lam' } },
  blocks: [
    {
      id: 'schedule',
      label: 'Lịch rảnh',
      title: 'Việc tự tìm đến bạn',
      body: 'Khai lịch rảnh để nhận gợi ý ca phù hợp.',
      cta: 'Tạo hồ sơ',
      detailLabel: 'Xem cách khớp lịch',
    },
    {
      id: 'near',
      label: 'Gần nhà',
      title: 'Gần nhà, đúng quãng đường',
      body: 'Chọn bán kính và xem khoảng cách trước khi ứng tuyển.',
      cta: 'Xem việc gần tôi',
      detailLabel: 'Xem cách tính quãng đường',
    },
    {
      id: 'match',
      label: 'Kết nối',
      title: 'Kết nối rồi mới trò chuyện',
      body: 'Hai bên cùng quan tâm thì kênh chat riêng mới mở ra.',
      cta: 'Xem kết nối',
      detailLabel: 'Xem cách kết nối',
    },
    {
      id: 'guide',
      label: 'Cẩm nang',
      title: 'Cẩm nang đi làm',
      body: 'Viết hồ sơ ngắn gọn, đi phỏng vấn ca đầu tiên, hiểu quyền lợi của người làm linh hoạt.',
      cta: 'Đọc cẩm nang',
      detailLabel: 'Xem cẩm nang',
    },
  ],
  fresh: { title: 'Việc mới đăng', all: { label: 'Xem việc mới đăng', href: '/viec-lam' } },
  explore: {
    title: 'Việc theo khu vực và hình thức',
    /** Nhóm ngành của bảng ca (`categories.ts`): `q` là từ khóa lọc ở /viec-lam, cũng dùng để xếp việc vào nhóm */
    categories: [
      { key: 'pha_che', label: 'Pha chế', q: 'Pha chế' },
      { key: 'ban_hang', label: 'Bán hàng', q: 'Bán hàng' },
      { key: 'giao_hang', label: 'Giao hàng', q: 'Lái xe máy' },
      { key: 'phuc_vu', label: 'Phục vụ', q: 'Phục vụ' },
      { key: 'kho', label: 'Kho hàng', q: 'Kho' },
    ],
    districts: 'Khu vực',
    types: 'Hình thức',
  },
  recruiter: {
    title: 'Tuyển người theo ca làm',
    body: 'Đăng tin kèm ca làm và tiêu chí rõ ràng, Workmate gợi ý người rảnh đúng ca và sống gần chỗ làm.',
    cta: { label: 'Đăng tin tuyển dụng', href: '/dang-tin' },
  },
  final: { title: 'Tìm việc theo lịch rảnh của bạn' },
}

/**
 * Chữ riêng cho nhà tuyển dụng và người tìm việc ở các section ②–⑦ (khách và quản trị
 * dùng bản `homeSections` ở trên). Người tìm việc chỉ khác ở section ②; nhà tuyển dụng
 * khác ở tất cả. Dữ liệu trong thẻ là dữ liệu demo của dự án.
 */
export const homeSectionsByRole = {
  jobseeker: {
    urgent: {
      title: 'Việc hợp với bạn',
      all: { label: 'Xem việc phù hợp với tôi', href: '/tim-viec/phu-hop' },
      /** aria-label của nút ‹ › */
      prev: 'Xem các việc trước',
      next: 'Xem các việc tiếp theo',
    },
    /** Tấm tối ⑥: người tìm việc thấy lời mời tìm việc thay cho lời mời đăng tin */
    panel: {
      title: 'Tìm việc hợp lịch rảnh của bạn',
      body: 'Khai lịch rảnh và khu vực một lần, Workmate gợi ý việc đúng ca, gần nhà.',
      cta: { label: 'Xem việc phù hợp với tôi', href: '/tim-viec/phu-hop' },
    },
  },
  recruiter: {
    urgent: {
      title: 'Ứng viên sẵn sàng đi làm',
      all: { label: 'Xem ứng viên sẵn sàng', href: '/tuyen-dung/tim-ung-vien' },
      prev: 'Xem các ứng viên trước',
      next: 'Xem các ứng viên tiếp theo',
    },
    blocksLabel: 'Workmate giúp bạn tìm người thế nào',
    blocks: [
      {
        id: 'slots',
        label: 'Đúng ca',
        title: 'Người rảnh đúng ca bạn cần',
        body: 'Đăng tin kèm ca làm, Workmate gợi ý những người đang rảnh đúng các ca đó.',
        cta: 'Đăng tin tuyển dụng',
        detailLabel: 'Xem cách chọn ca',
        href: '/dang-tin',
      },
      {
        id: 'nearby',
        label: 'Gần cửa hàng',
        title: 'Ứng viên sống gần cửa hàng',
        body: 'Người ở gần đi làm đúng giờ và gắn bó lâu hơn. Xem ai quanh cửa hàng đang sẵn sàng nhận việc.',
        cta: 'Tìm ứng viên',
        detailLabel: 'Xem cách tìm người gần',
        href: '/match', // trang web, không vào dashboard
      },
    ],
    mine: {
      title: 'Tin của bạn',
      // Trang chủ chỉ dẫn tới trang web, không vào dashboard: xem tin của mình trên trang công ty công khai
      all: { label: 'Xem trang công ty', href: '/cong-ty/song-han' },
      interested: (n: number) => `${n} người quan tâm`,
      empty: {
        body: 'Bạn chưa có tin tuyển dụng nào. Đăng tin đầu tiên để nhận gợi ý ứng viên.',
        cta: { label: 'Đăng tin tuyển dụng', href: '/dang-tin' },
      },
      /** Nhãn trạng thái tin (kiểm duyệt thắng trạng thái đăng tuyển) */
      status: {
        open: 'Đang mở',
        paused: 'Tạm dừng',
        closed: 'Đã đóng',
        pending: 'Chờ duyệt',
        rejected: 'Bị từ chối',
        hidden: 'Bị ẩn',
      },
    },
    explore: {
      title: 'Ứng viên theo khu vực và kỹ năng',
      districts: 'Khu vực',
      skills: 'Kỹ năng',
    },
    panel: {
      title: 'Hoàn thiện trang công ty',
      body: 'Trang công ty đầy đủ giúp ứng viên tin tưởng hơn và dễ nhận lời hơn.',
      cta: { label: 'Hoàn thiện trang công ty', href: '/tuyen-dung/ho-so-cong-ty' },
    },
    final: { title: 'Đăng tin cho ca đang thiếu', cta: { label: 'Đăng tin tuyển dụng', href: '/dang-tin' } },
  },
}

/* ── 3 thẻ tính năng kính ở đáy hero, theo vai trò (khách và ứng viên cùng một bộ) ── */
export type HeroFeature = {
  /** Khóa biểu tượng — IntroHero/HeroFeatureCards ánh xạ sang lucide */
  icon: 'target' | 'calendar' | 'users' | 'briefcase' | 'userCheck' | 'shield' | 'fileCheck' | 'building'
  title: string
  body: string
  link: { label: string; href: string }
}

const connectFeature: HeroFeature = {
  icon: 'users',
  title: 'Kết nối khi cả hai cùng muốn',
  body: 'Hai bên cùng quan tâm thì kênh chat riêng mới mở.',
  link: { label: 'Xem cách kết nối', href: '/match' },
}

const guestFeatures: HeroFeature[] = [
  {
    icon: 'target',
    title: 'Việc làm phù hợp',
    body: 'Gợi ý theo lịch rảnh, vị trí và kỹ năng của bạn.',
    link: { label: 'Xem việc phù hợp', href: '/dang-ky?role=jobseeker' },
  },
  {
    icon: 'calendar',
    title: 'Quản lý lịch rảnh',
    body: 'Cập nhật buổi rảnh, gợi ý tự khớp theo lịch mới.',
    link: { label: 'Cập nhật lịch', href: '/dang-ky?role=jobseeker' },
  },
  connectFeature,
]

export const heroFeatures: Record<'guest' | 'jobseeker' | 'recruiter' | 'admin', HeroFeature[]> = {
  guest: guestFeatures,
  jobseeker: [
    { ...guestFeatures[0], link: { label: 'Xem việc phù hợp', href: '/tim-viec/phu-hop' } },
    { ...guestFeatures[1], link: { label: 'Cập nhật lịch', href: '/ho-so#lich-ranh' } },
    connectFeature,
  ],
  recruiter: [
    {
      icon: 'briefcase',
      title: 'Đăng ca tuyển dụng',
      body: 'Khai đúng ca cần người, Workmate tìm người rảnh ca đó.',
      link: { label: 'Đăng ca', href: '/dang-tin' },
    },
    {
      icon: 'userCheck',
      title: 'Ứng viên phù hợp',
      body: 'Ứng viên được gợi ý theo ca, khu vực và kỹ năng.',
      link: { label: 'Xem ứng viên', href: '/tuyen-dung/tim-ung-vien' },
    },
    {
      icon: 'users',
      title: 'Kết nối khi cả hai cùng muốn',
      body: 'Quan tâm ứng viên, hai bên đồng ý thì chat mở.',
      link: { label: 'Xem kết nối', href: '/match' },
    },
  ],
  admin: [
    {
      icon: 'shield',
      title: 'Xác minh doanh nghiệp',
      body: 'Duyệt hồ sơ công ty đang chờ xác minh.',
      link: { label: 'Xác minh hồ sơ', href: '/admin/xac-minh' },
    },
    {
      icon: 'fileCheck',
      title: 'Kiểm duyệt tin',
      body: 'Xem các tin tuyển dụng cần kiểm tra.',
      link: { label: 'Kiểm duyệt tin', href: '/admin/kiem-duyet' },
    },
    {
      icon: 'building',
      title: 'Nhà tuyển dụng',
      body: 'Theo dõi doanh nghiệp và người dùng mới.',
      link: { label: 'Xem nhà tuyển dụng', href: '/admin/nha-tuyen-dung' },
    },
  ],
}

/**
 * Ảnh 3D hai bên hero (PNG/WebP nền trong suốt) — chủ dự án sẽ gửi sau.
 * Thêm ảnh: đặt file vào `src/assets/` (hoặc `public/`), import rồi gán, ví dụ
 *   import calendar3d from '@assets/hero-calendar.webp'
 *   left: { src: calendar3d, alt: '' }
 * `null` = không dựng gì. Chỉ hiện từ lg, trang trí (aria-hidden), nằm trong lề hai bên nên không đè chữ.
 */
export const heroArt: { left: null | { src: string; alt: string }; right: null | { src: string; alt: string } } = {
  // tắt 2026-11-22 cho cầu Rồng nổi bật; bật lại: gán lại ảnh
  // left: { src: heroArtCalendar, alt: '' }, right: { src: heroArtBriefcase, alt: '' }
  left: null,
  right: null,
}
// Giữ import để bật lại nhanh (tránh lỗi "unused" bằng cách tham chiếu ở đây)
void heroArtCalendar
void heroArtBriefcase

/**
 * Dải thành phố / cầu Rồng ở đáy hero (mọi vai trò). `null` = không dựng gì.
 * Cắm ảnh: chủ dự án gửi panorama rộng ~2400×600 (nền trời xanh hoặc trong suốt, WebP), đặt vào
 * `src/assets/images/home/`, rồi:
 *   import skyline from '@assets/images/home/hero-skyline.webp'
 *   export const heroSkyline = { src: skyline, alt: '' as const }
 * Khi có ảnh, tự có thêm đèn lấp lánh trên cầu + dải sáng mặt nước (HeroSkyline.tsx).
 */
export const heroSkyline: null | { src: string; alt: '' } = { src: heroSkylineImg, alt: '' }

/**
 * Bảng ca "đang cần người" (dưới hero): chữ theo vai trò. Quản trị xem như khách.
 * `empty`  nhận tên tab (Hôm nay / Ngày mai / Cuối tuần) ở dạng chữ thường.
 */
export const shiftBoardCopy = {
  guest: {
    title: 'Ca đang cần người tuần này',
    link: { label: 'Xem mọi ngành nghề', href: '/viec-lam' },
    apply: 'Ứng tuyển',
    applied: 'Đã ứng tuyển',
    emptyLink: 'Xem việc theo ca',
  },
  jobseeker: {
    title: 'Ca khớp lịch rảnh của bạn tuần này',
    link: { label: 'Xem mọi ngành nghề', href: '/viec-lam' },
    apply: 'Ứng tuyển',
    applied: 'Đã ứng tuyển',
    emptyLink: 'Xem việc theo ca',
  },
  recruiter: {
    title: 'Ca của bạn đang cần người',
    link: { label: 'Xem tin của bạn', href: '/tuyen-dung/tin-dang' },
    candidates: 'Xem ứng viên',
    emptyLink: 'Đăng tin tuyển người',
    emptyHref: '/dang-tin',
  },
  subtitle: 'Chọn ngành nghề phù hợp với thời gian bạn có thể làm',
  recruiterSubtitle: 'Lọc theo buổi và ngày để xem ca còn thiếu người',
  filters: { session: 'Buổi làm', day: 'Ngày làm', allSessions: 'Tất cả', allWeek: 'Cả tuần' },
  emptyFiltered: 'Chưa có ca nào vào buổi/ngày này. Thử chọn buổi hoặc ngày khác.',
  resetFilters: 'Đặt lại bộ lọc',
  note: 'Dữ liệu minh họa, chưa phải tin tuyển dụng thật',
  carouselLabel: 'Các nghề đang cần người',
  prevLabel: 'Xem nghề trước',
  nextLabel: 'Xem nghề tiếp theo',
  fitLabel: (n: number) => `${n}% hợp`,
  freeLabel: (n: number) => (n === 0 ? 'Chưa có ứng viên rảnh ca này' : `${n} ứng viên rảnh ca này`),
  /** Thẻ ngành */
  catShifts: 'ca đang tuyển',
  catCompanies: (n: number) => `${n} doanh nghiệp`,
  catEarliest: (when: string) => `Ca gần nhất: ${when}`,
  catHint: 'Xem ca làm',
  listTitle: (cat: string) => `Doanh nghiệp tuyển ${cat.toLowerCase()}`,
  close: 'Đóng',
  closeLabel: (cat: string) => `Đóng danh sách ${cat.toLowerCase()}`,
  emptyText: 'Chưa có ca nào trong 7 ngày tới.',
  emptyJobseeker: 'Chưa có ca nào trong 7 ngày tới nằm trong lịch rảnh của bạn.',
}
