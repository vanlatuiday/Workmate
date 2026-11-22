const LABELS = [
  'Họ tên', 'Giới thiệu ngắn', 'Khu vực sinh sống', 'Học vấn', 'Ngày sinh',
  'Kỹ năng', 'Kinh nghiệm làm việc', 'Công việc mong muốn', 'Hình thức mong muốn',
  'Mức lương mong muốn', 'Khoảng cách đi làm', 'Phương tiện đi lại',
  'Lịch rảnh theo từng ngày', 'Email', 'Số điện thoại',
];
const DISTRICTS = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'];
const AREA_ALIASES = { 'Hòa Cường': 'Hải Châu', 'Hòa Khánh': 'Liên Chiểu', 'An Thượng': 'Ngũ Hành Sơn' };
const SKILL_ALIASES = {
  'giao tiếp tiếng anh': 'Tiếng Anh giao tiếp',
  'giao tiếp khách': 'Giao tiếp khách hàng',
  'ưu tiên làm việc nhóm': 'Làm việc nhóm',
  'teamwork': 'Làm việc nhóm',
  'hỗ trợ nhóm': 'Làm việc nhóm',
  'sơ chế': 'Sơ chế thực phẩm',
  'an toàn thực phẩm': 'An toàn thực phẩm',
  'kiểm kê': 'Kiểm kho',
  'sử dụng pos': 'POS',
  'pos': 'POS',
  'order': 'Nhận order',
  'nhận order': 'Nhận order',
  'chạy bàn': 'Phục vụ bàn',
  'viết caption': 'Viết nội dung',
};

function readFields(text) {
  if (typeof text !== 'string') throw new Error('Nội dung hồ sơ phải là chuỗi');
  const fields = new Map();
  let label;
  for (const line of text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')) {
    const colon = line.indexOf(':');
    const key = line.slice(0, colon).trim();
    if (colon >= 0 && LABELS.includes(key)) {
      if (fields.has(key)) throw new Error(`Trùng trường ${key}`);
      label = key;
      fields.set(label, line.slice(colon + 1).trim());
    } else if (label) {
      fields.set(label, `${fields.get(label)}\n${line}`);
    }
  }
  return (name) => {
    const value = fields.get(name)?.trim();
    if (!value) throw new Error(`Thiếu trường ${name}`);
    return value;
  };
}

function parseBirthDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) throw new Error(`Ngày sinh không hợp lệ: ${value}`);
  const [, day, month, year] = match.map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Ngày sinh không hợp lệ: ${value}`);
  }
  return date;
}

function parseSalary(value) {
  const match = /^(\d{1,3}(?:,\d{3})+|\d{1,3}(?:\.\d{3})+|\d+)\s+VNĐ\/giờ$/u.exec(value);
  const dong = match && Number(match[1].replace(/[,.]/g, ''));
  if (!Number.isSafeInteger(dong) || dong <= 0 || dong % 1000 !== 0) {
    throw new Error(`Mức lương không hợp lệ: ${value}`);
  }
  return dong / 1000;
}

function parseJobTypes(value) {
  const text = value.toLocaleLowerCase('vi');
  const types = [
    ['full_time', /toàn thời gian|full[ -]time/],
    ['part_time', /bán thời gian|part[ -]time/],
    ['shift', /theo ca|nhận ca/],
    ['seasonal', /thời vụ/],
    ['flexible', /linh hoạt/],
    ['event', /sự kiện/],
    ['freelance', /cộng tác viên|freelance/],
  ].filter(([, pattern]) => pattern.test(text)).map(([type]) => type);
  if (!types.length) throw new Error(`Hình thức mong muốn không hợp lệ: ${value}`);
  return types;
}

function parseAvailability(value) {
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const seen = new Set();
  const intervals = [];
  const week = 7 * 24 * 60;
  for (const line of value.split('\n').filter((line) => line.trim())) {
    const match = /^-\s*(Thứ [2-7]|Chủ nhật):\s*(.+)$/u.exec(line.trim());
    if (!match || seen.has(match[1])) throw new Error(`Lịch rảnh không hợp lệ: ${line}`);
    seen.add(match[1]);
    if (match[2] === 'Không đăng ký ca') continue;
    const day = days.indexOf(match[1]);
    for (const range of match[2].split(';')) {
      const time = /^\s*(\d{2}):(\d{2})\s*[–—-]\s*(\d{2}):(\d{2})\s*$/u.exec(range);
      if (!time) throw new Error(`Giờ rảnh không hợp lệ: ${range}`);
      const [, fromHour, fromMinute, toHour, toMinute] = time.map(Number);
      const from = fromHour * 60 + fromMinute;
      let to = toHour * 60 + toMinute;
      if (fromHour > 23 || fromMinute > 59 || toHour > 24 || toMinute > 59 || (toHour === 24 && toMinute !== 0) || from === to) {
        throw new Error(`Giờ rảnh không hợp lệ: ${range}`);
      }
      if (to < from) to += 24 * 60;
      // Repeat weekly intervals so Sunday nights can join Monday's early hours.
      for (const offset of [-week, 0, week]) intervals.push([day * 1440 + from + offset, day * 1440 + to + offset]);
    }
  }
  if (seen.size !== 7) throw new Error('Lịch rảnh phải có đủ bảy ngày');
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const interval of intervals) {
    const previous = merged.at(-1);
    if (previous && interval[0] <= previous[1]) previous[1] = Math.max(previous[1], interval[1]);
    else merged.push([...interval]);
  }
  const sessions = [[420, 720], [780, 1020], [1020, 1320], [1320, 1800]];
  return days.flatMap((_, day) => sessions.flatMap(([start, end], session) =>
    merged.some(([from, to]) => from <= day * 1440 + start && to >= day * 1440 + end) ? [`${day}-${session}`] : []));
}

/** Parse profile fields only; account identifiers and uploaded image URLs belong to the importer. */
export function parseSeekerProfile(text) {
  const get = readFields(text);
  const originalArea = get('Khu vực sinh sống');
  const locality = originalArea.split(',')[0].trim();
  const district = AREA_ALIASES[locality] ?? locality;
  if (!DISTRICTS.includes(district)) throw new Error(`Khu vực không hợp lệ: ${originalArea}`);
  const distance = /^Tối đa (\d+) km$/u.exec(get('Khoảng cách đi làm'));
  if (!distance || !Number.isSafeInteger(Number(distance[1])) || Number(distance[1]) <= 0) {
    throw new Error('Khoảng cách đi làm không hợp lệ');
  }
  const aboutLabels = ['Khu vực sinh sống', 'Học vấn', 'Kỹ năng', 'Kinh nghiệm làm việc', 'Công việc mong muốn', 'Hình thức mong muốn', 'Mức lương mong muốn', 'Khoảng cách đi làm', 'Phương tiện đi lại', 'Lịch rảnh theo từng ngày'];
  const about = aboutLabels.map((label) => `${label}:\n${get(label)}`).join('\n\n');
  return {
    fullName: get('Họ tên'),
    phone: get('Số điện thoại'),
    intro: get('Giới thiệu ngắn'),
    about,
    area: `${district}, Đà Nẵng`,
    salaryMinK: parseSalary(get('Mức lương mong muốn')),
    maxDistanceKm: Number(distance[1]),
    jobTypes: parseJobTypes(get('Hình thức mong muốn')),
    skills: [...new Set(get('Kỹ năng').split(/[,;]/u).map((skill) => {
      const original = skill.trim().replace(/\.$/, '');
      return SKILL_ALIASES[original.toLocaleLowerCase('vi')] ?? original;
    }).filter(Boolean))],
    availability: parseAvailability(get('Lịch rảnh theo từng ngày')),
    headline: get('Công việc mong muốn'),
    birthDate: parseBirthDate(get('Ngày sinh')),
    hobbies: [],
  };
}

/** Email stays on User; it is deliberately absent from the Prisma SeekerProfile payload. */
export function parseSeeker(text) {
  const email = readFields(text)('Email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) throw new Error('Email không hợp lệ');
  return { email, profile: parseSeekerProfile(text) };
}
