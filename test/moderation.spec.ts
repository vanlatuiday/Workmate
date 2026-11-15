import assert from 'node:assert/strict'
import { test } from 'node:test'
import { phraseHits, reviewJob, type FlagInput } from '../src/jobs/flags'
import { DEFAULT_CONFIG } from '../src/common/system-config.service'

const cfg = DEFAULT_CONFIG
const job = (over: Partial<FlagInput> = {}): FlagInput => ({
  title: 'Nhân viên pha chế ca tối',
  description: 'Pha chế đồ uống, dọn quầy cuối ca. Có đào tạo ban đầu.',
  skills: ['Pha chế'], slots: ['0-2'], salaryMinK: 25, salaryMaxK: 30, ...over,
})

test('tin sạch: không cụm cấm, không dấu hiệu', () => {
  assert.deepEqual(reviewJob(job(), cfg), { banned: [], signals: [] })
})

test('cụm cấm tuyệt đối: có dấu, không dấu, viết hoa', () => {
  for (const d of ['Ứng viên cần đặt cọc 200k', 'can dat coc truoc khi nhan viec', 'YÊU CẦU ĐẶT CỌC']) {
    assert.ok(reviewJob(job({ description: d }), cfg).banned.includes('đặt cọc'), d)
  }
})

test('lách bằng dấu chấm / khoảng trắng chèn giữa chữ vẫn bị bắt', () => {
  for (const d of ['đ.ặ.t c.ọ.c giữ chỗ', 'd a t c o c', 'chuyển-khoản-trước giúp mình']) {
    assert.ok(reviewJob(job({ description: d }), cfg).banned.length > 0, d)
  }
})

test('phủ định: "không thu phí hồ sơ" không bị tự từ chối mà chỉ giữ lại cho admin', () => {
  for (const d of ['Không thu phí hồ sơ, không đặt cọc.', 'Cam kết miễn phí hồ sơ', 'Tuyệt đối không yêu cầu chuyển khoản trước']) {
    const r = reviewJob(job({ description: d }), cfg)
    assert.deepEqual(r.banned, [], d)
    assert.ok(r.signals.some((s) => s.startsWith('Nhắc tới cụm từ cấm kèm phủ định')), d)
  }
})

test('có cả câu phủ định lẫn câu vi phạm thật → vẫn từ chối', () => {
  assert.ok(reviewJob(job({ description: 'Không thu phí hồ sơ. Nhận việc cần đặt cọc 300k.' }), cfg).banned.includes('đặt cọc'))
})

test('cụm ngắn so nguyên từ, không bắt nhầm khi nằm bên trong từ khác', () => {
  assert.deepEqual(phraseHits('pha chế cocktail', ['cọc']).hits, [])
  assert.deepEqual(phraseHits('đóng cọc trước cửa', ['cọc']).hits, ['cọc'])
})

test('kéo ra ngoài: số điện thoại, Zalo, link', () => {
  for (const d of ['Liên hệ 0905 123 456', 'Nhắn Zalo cho mình nhé', 'Xem thêm tại bit.ly/abc hoặc www.example.com', 'Gửi CV qua hr@congty.vn']) {
    assert.ok(reviewJob(job({ description: d }), cfg).signals.some((s) => s.includes('kéo người dùng ra ngoài')), d)
  }
})

test('không bắt nhầm số thường là điện thoại', () => {
  assert.ok(!reviewJob(job({ description: 'Ca 18:00-22:00, cách trung tâm 500m, tuyển 3 bạn' }), cfg).signals.some((s) => s.includes('kéo')))
})

test('lương phi lý: quá cao, mô tả khác ô lương, hứa thu nhập lớn', () => {
  assert.ok(reviewJob(job({ salaryMinK: 150, salaryMaxK: 200 }), cfg).signals.some((s) => s.startsWith('Lương cao bất thường')))
  assert.ok(reviewJob(job({ description: 'Lương 80k/giờ hấp dẫn' }), cfg).signals.some((s) => s.startsWith('Lương trong mô tả')))
  assert.ok(!reviewJob(job({ description: 'Lương 28k/giờ' }), cfg).signals.some((s) => s.startsWith('Lương trong mô tả')))
  assert.ok(reviewJob(job({ description: 'Thu nhập 20-30 triệu/tháng' }), cfg).signals.some((s) => s.startsWith('Hứa thu nhập cao')))
})

test('đòi tiền / giấy tờ (từ đáng ngờ) và câu kéo', () => {
  assert.ok(reviewJob(job({ description: 'Đi làm cần nộp CCCD gốc và đóng phí đào tạo' }), cfg).signals.some((s) => s.startsWith('Có cụm từ đáng ngờ')))
  assert.ok(reviewJob(job({ title: 'TUYỂN GẤP NHÂN VIÊN PHỤC VỤ' }), cfg).signals.includes('Viết HOA gần như toàn bộ'))
  assert.ok(reviewJob(job({ description: 'Việc ngon lắm!!!' }), cfg).signals.includes('Nhiều dấu chấm than liên tiếp'))
})
