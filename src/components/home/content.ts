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
  { title: 'Cộng tác viên bán hàng trực tuyến',   location: 'Làm từ xa',             type: 'Linh hoạt',     salary: 'Theo hoa hồng' },
  { title: 'Nhân viên giao hàng',        location: 'Toàn thành phố',        type: 'Theo ngày',     salary: '200.000đ/ngày' },
]

export const steps = [
  { title: 'Tạo hồ sơ trong 5 phút', body: 'Kỹ năng, khu vực và lịch rảnh trong tuần là đủ.' },
  { title: 'Nhận gợi ý vừa khít', body: 'Mỗi việc làm kèm điểm phù hợp và lý do vì sao nó hợp với bạn.' },
  { title: 'Kết nối rồi mới trò chuyện', body: 'Hai bên cùng quan tâm thì kênh chat riêng mở ra, hẹn phỏng vấn ngay trong đó.' },
]

export const brandStatement =
  'Thành công của Workmate là số người thật sự đi làm.'

/** Lời mở đầu trang chủ theo người đang xem. Khách: trung lập cho cả hai phía.
    `search` = hiện ô tìm việc; `actions` = các nút thay cho ô tìm việc. */
export type HeroCopy = {
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
    lead: 'Một công việc vừa với lịch sống, hay một người làm đúng ca bạn thiếu. Workmate chỉ kết nối khi cả hai bên cùng phù hợp.',
    search: true,
    actions: [{ label: 'Đăng tin tuyển người', href: '/dang-ky?role=recruiter' }],
  },
  jobseeker: {
    title: 'Hôm nay bạn muốn làm việc gì?',
    titleLines: ['Hôm nay bạn muốn', 'làm việc gì?'],
    lead: 'Gợi ý dựa trên lịch rảnh, vị trí và kỹ năng trong hồ sơ của bạn.',
    search: true,
    actions: [{ label: 'Xem việc phù hợp với tôi', href: '/tim-viec/phu-hop' }],
  },
  recruiter: {
    title: 'Bạn đang thiếu vị trí nào?',
    titleLines: ['Bạn đang thiếu', 'vị trí nào?'],
    lead: 'Đăng tin với lịch làm và tiêu chí rõ ràng. Workmate gợi ý người rảnh đúng ca, sống gần và đủ kỹ năng.',
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

export type Audience = 'guest' | 'jobseeker' | 'recruiter' | 'admin'

export type HomeCopy = {
  fit: { title: string; lead: string; items: { title: string; body: string }[] }
  opportunities: {
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
  { title: 'Cộng tác bán hàng trực tuyến', location: 'Làm từ xa', type: 'Linh hoạt', salary: 'Theo hoa hồng' },
  { title: 'Giao hàng · có xe máy', location: 'Toàn thành phố', type: 'Theo ngày', salary: 'Mong muốn 200.000đ/ngày' },
]

const guestCopy: HomeCopy = {
  fit: {
    title: 'Ghép việc theo lịch rảnh và quãng đường.',
    lead: 'Người tìm việc khai lịch rảnh, quãng đường và mức lương mong muốn; nhà tuyển dụng khai ca làm và tiêu chí. Workmate chỉ ghép khi hai bên thật sự khớp.',
    items: [
      { title: 'Ca làm chỉ được gợi ý khi khớp lịch.', body: 'Ca làm cần người và giờ rảnh của người làm phải khớp nhau trước khi được gợi ý.' },
      { title: 'Gần nhau, đúng quãng đường mong muốn.', body: 'Khoảng cách đi làm được tính sẵn cho cả hai phía.' },
      benefits[2],
    ],
  },
  opportunities: {
    title: 'Việc đang mở quanh Đà Nẵng.',
    notice: 'Dữ liệu minh họa, chưa phải tin tuyển dụng thật',
    cardLabel: 'Tin mẫu',
    cards: sampleJobs,
    link: { label: 'Xem việc làm', href: '/viec-lam' },
  },
  how: {
    title: 'Ba bước cho cả hai phía.',
    steps: [
      { title: 'Khai điều kiện thật', body: 'Người tìm việc: kỹ năng, khu vực, lịch rảnh. Nhà tuyển dụng: vị trí, ca làm, tiêu chí bắt buộc.' },
      { title: 'Nhận gợi ý có lý do', body: 'Mỗi gợi ý kèm điểm phù hợp và vì sao, cho cả việc làm lẫn ứng viên.' },
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
      title: 'Công việc phù hợp với nhịp sống của bạn.',
      lead: 'Workmate bắt đầu từ lịch rảnh, quãng đường và mức lương bạn mong muốn, rồi mới tới danh sách việc làm.',
      items: benefits,
    },
    opportunities: {
      title: 'Việc đang chờ người như bạn.',
      notice: 'Dữ liệu minh họa, chưa phải tin tuyển dụng thật',
      cardLabel: 'Tin mẫu',
      cards: sampleJobs,
      link: { label: 'Xem việc phù hợp với tôi', href: '/tim-viec/phu-hop' },
    },
    how: { title: 'Ba bước, chỉ cần lịch rảnh và kỹ năng.', steps },
    closing: { title: 'Việc tiếp theo của bạn bắt đầu từ đây.' },
  },
  recruiter: {
    fit: {
      title: 'Người làm khớp với ca bạn đang thiếu.',
      lead: 'Workmate bắt đầu từ ca làm, khu vực và tiêu chí bắt buộc của bạn, rồi mới tới danh sách ứng viên.',
      items: [
        { title: 'Lịch làm là điều kiện.', body: 'Chỉ ứng viên rảnh đúng ca bạn cần mới được gợi ý.' },
        { title: 'Ứng viên sống gần chỗ làm.', body: 'Lọc theo quãng đường ứng viên chấp nhận đi. Ít bỏ ca, ít nghỉ ngang.' },
        { title: 'Chỉ kết nối khi cả hai bên cùng muốn.', body: 'Bạn và ứng viên cùng quan tâm thì kênh trò chuyện mới mở. Bạn chỉ xem hồ sơ khớp ca cần người.' },
      ],
    },
    opportunities: {
      title: 'Người đang rảnh đúng ca bạn cần.',
      notice: 'Dữ liệu minh họa, chưa phải hồ sơ thật',
      cardLabel: 'Hồ sơ mẫu',
      cardHref: '/tuyen-dung/ung-vien-phu-hop',
      cards: sampleCandidates,
      link: { label: 'Xem ứng viên phù hợp', href: '/tuyen-dung/ung-vien-phu-hop' },
    },
    how: {
      title: 'Ba bước, từ đăng tin đến phỏng vấn.',
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
  /** Ghi chú dữ liệu mẫu DUY NHẤT của trang chủ (taste skill: không lặp ghi chú mẫu) — đặt ở phần cuối */
  demoNotice: 'Việc làm, doanh nghiệp và hồ sơ trên trang là dữ liệu minh họa, chưa phải tin tuyển dụng thật.',
  /** Câu nhấn ở giữa trang (StatementSection): từng từ sáng dần theo cuộn */
  statement: 'Workmate ghép việc theo lịch rảnh, quãng đường và chỉ kết nối khi cả hai bên cùng muốn.',
  /** 3 tiêu chí bên phải câu nhấn (StatementSection). `word`: từ trong câu mà khi sáng tới thì mục này sáng theo */
  statementCriteria: {
    guest: [
      { key: 'lich', word: 'rảnh,', title: 'Lịch rảnh', body: 'Chọn các buổi bạn đi làm được trong tuần.', cta: { label: 'Khai lịch rảnh', href: '/dang-ky?role=jobseeker' } },
      { key: 'duong', word: 'đường', title: 'Quãng đường', body: 'Đặt khoảng cách tối đa từ nhà tới chỗ làm.', cta: { label: 'Đặt quãng đường', href: '/dang-ky?role=jobseeker' } },
      { key: 'ketnoi', word: 'kết', title: 'Kết nối', body: 'Hai bên cùng quan tâm thì kênh chat riêng mới mở.', cta: { label: 'Xem cách kết nối', href: '/match' } },
    ],
    jobseeker: [
      { key: 'lich', word: 'rảnh,', title: 'Lịch rảnh', body: 'Cập nhật buổi rảnh để gợi ý luôn khớp lịch.', cta: { label: 'Sửa lịch rảnh', href: '/tim-viec/ho-so#lich-ranh' } },
      { key: 'duong', word: 'đường', title: 'Quãng đường', body: 'Đổi khu vực và khoảng cách bạn muốn đi làm.', cta: { label: 'Sửa quãng đường', href: '/tim-viec/ho-so#thong-tin' } },
      { key: 'ketnoi', word: 'kết', title: 'Kết nối', body: 'Nhà tuyển dụng đồng ý thì kênh chat với bạn mở ra.', cta: { label: 'Xem việc đã ứng tuyển', href: '/match' } },
    ],
    recruiter: [
      { key: 'lich', word: 'rảnh,', title: 'Ca làm', body: 'Khai đúng ca cần người, Workmate tìm người rảnh ca đó.', cta: { label: 'Khai ca làm', href: '/dang-tin' } },
      { key: 'duong', word: 'đường', title: 'Khu vực', body: 'Ứng viên được gợi ý theo quãng đường tới cửa hàng.', cta: { label: 'Chọn khu vực tuyển', href: '/dang-tin' } },
      { key: 'ketnoi', word: 'kết', title: 'Kết nối', body: 'Quan tâm ứng viên, hai bên đồng ý thì chat mở.', cta: { label: 'Xem ứng viên phù hợp', href: '/match' } },
    ],
  },
  urgent: { title: 'Việc đang tuyển gấp', all: { label: 'Xem việc tuyển gấp', href: '/viec-lam' } },
  blocks: [
    {
      id: 'schedule',
      label: 'Lịch rảnh',
      title: 'Việc tự tìm đến bạn',
      body: 'Khai lịch rảnh một lần, những ca khớp với giờ học, giờ làm của bạn sẽ được gợi ý.',
      cta: 'Tạo hồ sơ',
      detailLabel: 'Xem cách khớp lịch',
    },
    {
      id: 'near',
      label: 'Gần nhà',
      title: 'Gần nhà, đúng quãng đường',
      body: 'Đặt bán kính di chuyển bạn chấp nhận, Workmate chỉ hiện việc nằm trong tầm đó.',
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

/* ── Thẻ xem trước theo vai trò ở đáy hero — dữ liệu minh họa, không phải tin thật ── */
export const heroPreview = {
  note: 'Dữ liệu minh họa',
  jobseeker: {
    label: 'Ứng viên',
    title: 'Việc hợp với bạn',
    rows: [
      { initial: 'G', title: 'Pha chế ca tối', company: 'Quán Gió Sông Hàn', district: 'Sơn Trà', fit: 92 },
      { initial: 'N', title: 'Thu ngân cuối tuần', company: 'Nhóm Dịch Vụ Sông Hàn', district: 'Hải Châu', fit: 87 },
      { initial: 'B', title: 'Bán hàng cuối tuần', company: 'Cửa hàng Biển Xanh', district: 'Hải Châu', fit: 81 },
    ],
  },
  recruiter: {
    label: 'Nhà tuyển dụng',
    title: 'Ứng viên phù hợp',
    initials: 'ƯV',
    name: 'Ứng viên mẫu',
    role: 'Pha chế · 1 năm kinh nghiệm',
    skills: ['Pha chế', 'Giao tiếp', 'Ca tối'],
    week: [
      { day: 'T2', free: false },
      { day: 'T3', free: true },
      { day: 'T4', free: false },
      { day: 'T5', free: true },
      { day: 'T6', free: true },
      { day: 'T7', free: true },
      { day: 'CN', free: true },
    ],
    fit: 88,
  },
  admin: {
    label: 'Quản trị',
    title: 'Tin đã kiểm duyệt',
    rows: ['Quán Gió Sông Hàn', 'Cửa hàng Biển Xanh', 'Nhóm Dịch Vụ Sông Hàn'],
    footer: 'Chỉ hiện tin của doanh nghiệp đã xác minh',
  },
}

/**
 * Bảng ca "đang cần người" (dưới hero): chữ theo vai trò. Quản trị xem như khách.
 * `empty` nhận tên tab (Hôm nay / Ngày mai / Cuối tuần) ở dạng chữ thường.
 */
export const shiftBoardCopy = {
  guest: {
    title: 'Ca đang cần người tuần này',
    link: { label: 'Xem việc theo ca', href: '/viec-lam' },
    apply: 'Ứng tuyển',
    applied: 'Đã ứng tuyển',
    emptyLink: 'Xem việc theo ca',
  },
  jobseeker: {
    title: 'Ca khớp lịch rảnh của bạn tuần này',
    link: { label: 'Xem việc theo ca', href: '/viec-lam' },
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
  note: 'Dữ liệu minh họa, chưa phải tin tuyển dụng thật',
  carouselLabel: 'Các nghề đang cần người',
  prevLabel: 'Xem nghề trước',
  nextLabel: 'Xem nghề tiếp theo',
  moreLabel: 'Xem thêm nghề',
  fitLabel: (n: number) => `${n}% hợp`,
  freeLabel: (n: number) => (n === 0 ? 'Chưa có ứng viên rảnh ca này' : `${n} ứng viên rảnh ca này`),
  /** Thẻ ngành */
  catStats: (shifts: number, companies: number) => `${shifts} ca · ${companies} doanh nghiệp đang cần người`,
  catEarliest: (when: string) => `Sớm nhất: ${when}`,
  catHint: 'Xem doanh nghiệp',
  listTitle: (cat: string) => `Doanh nghiệp tuyển ${cat.toLowerCase()}`,
  close: 'Đóng',
  closeLabel: (cat: string) => `Đóng danh sách ${cat.toLowerCase()}`,
  emptyText: 'Chưa có ca nào trong 7 ngày tới.',
  emptyJobseeker: 'Chưa có ca nào trong 7 ngày tới nằm trong lịch rảnh của bạn.',
}
