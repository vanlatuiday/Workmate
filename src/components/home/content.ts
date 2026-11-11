/** Nội dung trang chủ — sửa tại đây, không cần đụng vào các component. */

export const heroTags = ['Barista', 'Bán hàng', 'Marketing', 'Giao hàng', 'Phục vụ']

export const benefits = [
  {
    title: 'Lịch rảnh là điều kiện, không phải tiêu chí phụ.',
    body: 'Nhập giờ học, giờ làm hiện tại — chỉ những ca khớp với bạn mới được đề xuất.',
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

export type SampleJob = {
  title: string
  location: string
  type: string
  salary: string
}

/** Tin mẫu — không phải vị trí tuyển dụng có thật. Thẻ đầu tiên hiển thị lớn. */
const sampleJobs: SampleJob[] = [
  { title: 'Pha chế barista',            location: 'Thanh Khê, Đà Nẵng',    type: 'Bán thời gian', salary: '25.000–30.000đ/giờ' },
  { title: 'Nhân viên bán hàng',         location: 'Hải Châu, Đà Nẵng',     type: 'Theo ca',       salary: '4–5 triệu/tháng' },
  { title: 'Thực tập sinh marketing',    location: 'Sơn Trà, Đà Nẵng',      type: 'Toàn thời gian', salary: 'Thỏa thuận' },
  { title: 'Nhân viên phục vụ',          location: 'Ngũ Hành Sơn, Đà Nẵng', type: 'Cuối tuần',     salary: '30.000đ/giờ' },
  { title: 'Cộng tác viên bán online',   location: 'Làm từ xa',             type: 'Linh hoạt',     salary: 'Theo hoa hồng' },
  { title: 'Nhân viên giao hàng',        location: 'Toàn thành phố',        type: 'Theo ngày',     salary: '200.000đ/ngày' },
]

export const steps = [
  { title: 'Tạo hồ sơ trong 5 phút', body: 'Kỹ năng, khu vực và lịch rảnh trong tuần — không cần CV dài.' },
  { title: 'Nhận gợi ý vừa khít', body: 'Mỗi việc làm kèm điểm phù hợp và lý do vì sao nó hợp với bạn.' },
  { title: 'Kết nối rồi mới trò chuyện', body: 'Hai bên cùng quan tâm thì kênh chat riêng mở ra, hẹn phỏng vấn ngay trong đó.' },
]

export const brandStatement =
  'Chúng tôi không đo thành công bằng số tin đăng, mà bằng số người thật sự đi làm.'

/** Lời mở đầu trang chủ theo người đang xem. Khách: trung lập cho cả hai phía.
    `search` = hiện ô tìm việc; `actions` = các nút thay cho ô tìm việc. */
export type HeroCopy = {
  title: string
  lead: string
  search: boolean
  actions: { label: string; href: string }[]
}

export const heroCopy: Record<'guest' | 'jobseeker' | 'recruiter' | 'admin', HeroCopy> = {
  guest: {
    title: 'Bạn đang cần gì hôm nay?',
    lead: 'Một công việc vừa với lịch sống, hay một người làm đúng ca bạn thiếu — Workmate chỉ kết nối khi cả hai bên cùng phù hợp.',
    search: true,
    actions: [{ label: 'Tôi cần tuyển người', href: '/dang-ky?role=recruiter' }],
  },
  jobseeker: {
    title: 'Hôm nay bạn muốn làm việc gì?',
    lead: 'Gợi ý dựa trên lịch rảnh, vị trí và kỹ năng trong hồ sơ của bạn.',
    search: true,
    actions: [{ label: 'Xem việc phù hợp với tôi', href: '/tim-viec/phu-hop' }],
  },
  recruiter: {
    title: 'Bạn đang thiếu vị trí nào?',
    lead: 'Đăng tin với lịch làm và tiêu chí rõ ràng — Workmate gợi ý người rảnh đúng ca, sống gần và đủ kỹ năng.',
    search: false,
    actions: [
      { label: 'Đăng tin tuyển dụng', href: '/dang-tin' },
      { label: 'Xem ứng viên phù hợp', href: '/tuyen-dung/ung-vien-phu-hop' },
    ],
  },
  admin: {
    title: 'Hôm nay cần xử lý gì?',
    lead: 'Hồ sơ doanh nghiệp chờ xác minh, tin cần kiểm duyệt và người dùng mới.',
    search: false,
    actions: [
      { label: 'Xác minh doanh nghiệp', href: '/admin/xac-minh' },
      { label: 'Vào khu quản trị', href: '/admin' },
    ],
  },
}

/* ── Nội dung giữa trang chủ theo người đang xem ───────────────────────────
   Khách (và admin): trung lập, nói cho cả hai phía. Ứng viên / NTD: nói với đúng vai trò. */

export type Audience = 'guest' | 'jobseeker' | 'recruiter' | 'admin'

export type HomeCopy = {
  fit: { eyebrow: string; title: string; lead: string; items: { title: string; body: string }[] }
  opportunities: {
    eyebrow: string
    title: string
    notice: string
    cardLabel: string
    /** Bỏ trống = thẻ dẫn tới tìm việc theo tên thẻ */
    cardHref?: string
    cards: SampleJob[]
    link: { label: string; href: string }
  }
  how: { title: string; steps: { title: string; body: string }[] }
  closing: { title: string }
}

const matchStep = {
  title: 'Kết nối rồi mới trò chuyện',
  body: 'Hai bên cùng quan tâm thì kênh chat riêng mở ra, hẹn phỏng vấn ngay trong đó.',
}

/** Hồ sơ ứng viên mẫu cho nhà tuyển dụng — ẩn danh, không phải người thật. */
const sampleCandidates: SampleJob[] = [
  { title: 'Pha chế · 1 năm kinh nghiệm', location: 'Thanh Khê · cách 1,8 km', type: 'Rảnh tối T2–T6', salary: 'Mong muốn 25.000đ/giờ' },
  { title: 'Bán hàng · sinh viên năm 3', location: 'Hải Châu · cách 2,5 km', type: 'Rảnh buổi chiều', salary: 'Mong muốn 22.000đ/giờ' },
  { title: 'Thực tập marketing', location: 'Sơn Trà · cách 4 km', type: 'Toàn thời gian', salary: 'Thỏa thuận' },
  { title: 'Phục vụ · cuối tuần', location: 'Ngũ Hành Sơn · cách 3,2 km', type: 'Rảnh T7–CN', salary: 'Mong muốn 28.000đ/giờ' },
  { title: 'Cộng tác bán online', location: 'Làm từ xa', type: 'Linh hoạt', salary: 'Theo hoa hồng' },
  { title: 'Giao hàng · có xe máy', location: 'Toàn thành phố', type: 'Theo ngày', salary: 'Mong muốn 200.000đ/ngày' },
]

const guestCopy: HomeCopy = {
  fit: {
    eyebrow: 'Tìm đúng nhịp',
    title: 'Kết nối theo nhịp sống, không theo xấp hồ sơ.',
    lead: 'Người tìm việc khai lịch rảnh, quãng đường và mức lương mong muốn; nhà tuyển dụng khai ca làm và tiêu chí — Workmate chỉ ghép khi hai bên thật sự khớp.',
    items: [
      { title: 'Lịch là điều kiện, không phải tiêu chí phụ.', body: 'Ca làm cần người và giờ rảnh của người làm phải khớp nhau trước khi được gợi ý.' },
      { title: 'Gần nhau, đúng quãng đường mong muốn.', body: 'Khoảng cách đi làm được tính sẵn cho cả hai phía.' },
      benefits[2],
    ],
  },
  opportunities: {
    eyebrow: 'Đang diễn ra',
    title: 'Việc đang mở quanh Đà Nẵng.',
    notice: 'Dữ liệu minh họa — không phải tin tuyển dụng thật',
    cardLabel: 'Tin mẫu',
    cards: sampleJobs,
    link: { label: 'Xem việc làm', href: '/viec-lam' },
  },
  how: {
    title: 'Ba bước cho cả hai phía.',
    steps: [
      { title: 'Khai điều kiện thật', body: 'Người tìm việc: kỹ năng, khu vực, lịch rảnh. Nhà tuyển dụng: vị trí, ca làm, tiêu chí bắt buộc.' },
      { title: 'Nhận gợi ý có lý do', body: 'Mỗi gợi ý kèm điểm phù hợp và vì sao — cho việc làm lẫn ứng viên.' },
      matchStep,
    ],
  },
  closing: { title: 'Bước tiếp theo bắt đầu từ đây.' },
}

export const homeCopy: Record<Audience, HomeCopy> = {
  guest: guestCopy,
  admin: guestCopy,
  jobseeker: {
    fit: {
      eyebrow: 'Tìm đúng nhịp',
      title: 'Công việc phù hợp với nhịp sống của bạn.',
      lead: 'Workmate bắt đầu từ lịch rảnh, quãng đường và mức lương bạn mong muốn — rồi mới tới danh sách việc làm.',
      items: benefits,
    },
    opportunities: {
      eyebrow: 'Khám phá cơ hội',
      title: 'Việc đang chờ người như bạn.',
      notice: 'Dữ liệu minh họa — không phải tin tuyển dụng thật',
      cardLabel: 'Tin mẫu',
      cards: sampleJobs,
      link: { label: 'Xem việc phù hợp với tôi', href: '/tim-viec/phu-hop' },
    },
    how: { title: 'Ba bước, không cần CV dài.', steps },
    closing: { title: 'Việc tiếp theo của bạn bắt đầu từ đây.' },
  },
  recruiter: {
    fit: {
      eyebrow: 'Tuyển đúng ca',
      title: 'Người làm khớp với ca bạn đang thiếu.',
      lead: 'Workmate bắt đầu từ ca làm, khu vực và tiêu chí bắt buộc của bạn — rồi mới tới danh sách ứng viên.',
      items: [
        { title: 'Lịch làm là điều kiện.', body: 'Chỉ ứng viên rảnh đúng ca bạn cần mới được gợi ý.' },
        { title: 'Ứng viên sống gần chỗ làm.', body: 'Lọc theo quãng đường ứng viên chấp nhận đi — ít bỏ ca, ít nghỉ ngang.' },
        { title: 'Chỉ kết nối khi cả hai bên cùng muốn.', body: 'Bạn và ứng viên cùng quan tâm thì kênh trò chuyện mới mở — không phải đọc hàng trăm CV rải.' },
      ],
    },
    opportunities: {
      eyebrow: 'Ứng viên quanh bạn',
      title: 'Người đang rảnh đúng ca bạn cần.',
      notice: 'Dữ liệu minh họa — không phải hồ sơ thật',
      cardLabel: 'Hồ sơ mẫu',
      cardHref: '/tuyen-dung/ung-vien-phu-hop',
      cards: sampleCandidates,
      link: { label: 'Xem ứng viên phù hợp', href: '/tuyen-dung/ung-vien-phu-hop' },
    },
    how: {
      title: 'Ba bước, không cần đọc trăm CV.',
      steps: [
        { title: 'Đăng tin có tiêu chí', body: 'Vị trí, ca làm theo từng ngày, mức lương và tiêu chí bắt buộc.' },
        { title: 'Nhận ứng viên vừa khít', body: 'Mỗi ứng viên kèm điểm phù hợp và lý do: rảnh đúng ca, ở gần, đủ kỹ năng.' },
        matchStep,
      ],
    },
    closing: { title: 'Người phù hợp đang chờ tin của bạn.' },
  },
}

/* ── Các section bên dưới hero (trang chủ kiểu "ảnh + khối + hàng thẻ") ───────
   Ảnh đi kèm nằm ở homeMedia.ts. Toàn bộ là nội dung mẫu, thay tại đây. */

export const homeSections = {
  /** Chú thích gắn ở các hàng thẻ việc làm */
  sampleNote: 'Dữ liệu minh họa',
  urgent: { title: 'Việc đang tuyển gấp', all: { label: 'Xem tất cả', href: '/viec-lam' } },
  /** Lời dẫn của section ③ (khối ảnh dọc) — title ngắt dòng bằng '|' */
  blocksIntro: {
    eyebrow: 'Workmate giúp bạn thế nào',
    title: 'Việc làm|vừa với|nhịp sống.',
    lead: 'Khai lịch rảnh và khu vực một lần, phần còn lại để Workmate lo — từ gợi ý ca khớp giờ đến kết nối hai bên.',
    footer: 'đà nẵng   ·   2026',
  },
  blocks: [
    {
      id: 'schedule',
      label: 'Lịch rảnh',
      title: 'Việc tự tìm đến bạn',
      body: 'Khai lịch rảnh một lần — những ca khớp với giờ học, giờ làm của bạn sẽ được gợi ý, không phải ngồi lọc từng tin.',
      cta: 'Tạo hồ sơ',
    },
    {
      id: 'near',
      label: 'Gần nhà',
      title: 'Gần nhà, đúng quãng đường',
      body: 'Đặt bán kính di chuyển bạn chấp nhận, Workmate chỉ hiện việc nằm trong tầm đó.',
      cta: 'Xem việc gần tôi',
    },
    {
      id: 'match',
      label: 'Kết nối',
      title: 'Kết nối rồi mới trò chuyện',
      body: 'Hai bên cùng quan tâm thì kênh chat riêng mới mở ra — không tin nhắn rải, không bị làm phiền.',
      cta: 'Xem kết nối',
    },
    {
      id: 'guide',
      label: 'Cẩm nang',
      title: 'Cẩm nang đi làm',
      body: 'Viết hồ sơ ngắn gọn, đi phỏng vấn ca đầu tiên, hiểu quyền lợi của người làm linh hoạt.',
      cta: 'Đọc cẩm nang',
    },
  ],
  fresh: { title: 'Việc mới đăng', all: { label: 'Xem tất cả', href: '/viec-lam' } },
  explore: {
    title: 'Khám phá theo nhóm',
    /** `q` là từ khóa lọc ở /viec-lam; số việc đếm thật từ danh mục demo */
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
    title: 'Bạn đang thiếu người?',
    body: 'Đăng tin kèm ca làm và tiêu chí rõ ràng, Workmate gợi ý người rảnh đúng ca và sống gần chỗ làm.',
    cta: { label: 'Đăng tin tuyển dụng', href: '/dang-tin' },
  },
  final: { title: 'Chưa thấy việc hợp với bạn?', cta: 'Tìm việc ngay' },
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
      all: { label: 'Xem tất cả', href: '/tim-viec/phu-hop' },
      /** aria-label của nút ‹ › */
      prev: 'Xem các việc trước',
      next: 'Xem các việc tiếp theo',
    },
    /** Tấm tối ⑥: người tìm việc thấy lời mời tìm việc thay cho lời mời đăng tin */
    panel: {
      title: 'Bạn đang tìm việc?',
      body: 'Khai lịch rảnh và khu vực một lần, Workmate gợi ý việc đúng ca, gần nhà, không cần CV dài.',
      cta: { label: 'Xem việc phù hợp với tôi', href: '/tim-viec/phu-hop' },
    },
  },
  recruiter: {
    urgent: {
      title: 'Ứng viên sẵn sàng đi làm',
      all: { label: 'Xem tất cả', href: '/tuyen-dung/tim-ung-vien' },
      prev: 'Xem các ứng viên trước',
      next: 'Xem các ứng viên tiếp theo',
    },
    blocksLabel: 'Workmate giúp bạn tìm người thế nào',
    blocksIntro: {
      eyebrow: 'Workmate giúp bạn tìm người thế nào',
      title: 'Người đúng ca|ở ngay|gần bạn.',
      lead: 'Đăng tin kèm ca làm và vị trí, Workmate gợi ý những ứng viên đang rảnh và sống quanh cửa hàng của bạn.',
      footer: 'đà nẵng   ·   2026',
    },
    blocks: [
      {
        id: 'slots',
        label: 'Đúng ca',
        title: 'Người rảnh đúng ca bạn cần',
        body: 'Đăng tin kèm ca làm, Workmate chỉ gợi ý những người đang rảnh đúng các ca đó — không phải đọc từng hồ sơ.',
        cta: 'Đăng tin tuyển dụng',
        href: '/dang-tin',
      },
      {
        id: 'nearby',
        label: 'Gần cửa hàng',
        title: 'Ứng viên sống gần cửa hàng',
        body: 'Người ở gần đi làm đúng giờ và gắn bó lâu hơn. Xem ai quanh cửa hàng đang sẵn sàng nhận việc.',
        cta: 'Tìm ứng viên',
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
      title: 'Tìm ứng viên theo nhóm',
      /** `skill` là từ khóa khớp kỹ năng của ứng viên (không dấu, chữ thường) */
      categories: [
        { key: 'pha_che', label: 'Pha chế', skill: 'pha che' },
        { key: 'ban_hang', label: 'Bán hàng', skill: 'ban hang' },
        { key: 'phuc_vu', label: 'Phục vụ', skill: 'phuc vu' },
        { key: 'thu_ngan', label: 'Thu ngân', skill: 'thu ngan' },
      ],
      districts: 'Khu vực',
      skills: 'Kỹ năng',
      unit: 'ứng viên',
    },
    panel: {
      title: 'Hoàn thiện trang công ty',
      body: 'Trang công ty đầy đủ giúp ứng viên tin tưởng hơn và dễ nhận lời hơn.',
      cta: { label: 'Hoàn thiện trang công ty', href: '/tuyen-dung/ho-so-cong-ty' },
    },
    final: { title: 'Cần thêm người?', cta: { label: 'Đăng tin tuyển dụng', href: '/dang-tin' } },
  },
}
