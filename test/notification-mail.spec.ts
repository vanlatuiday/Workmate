import assert from 'node:assert/strict'
import { test } from 'node:test'
import { composeMail, digestCutoff, lineOf, type MailItem } from '../src/connections/notification-mail'

const item = (over: Partial<MailItem> = {}): MailItem => ({ kind: 'offer', side: 'seeker', jobTitle: 'Pha chế', companyName: 'Quán A', ...over })

test('mốc tóm tắt: trước 8:00 giờ Việt Nam thì lấy 8:00 hôm qua', () => {
  // 07:59 ngày 10 giờ VN = 00:59 UTC ngày 10
  assert.equal(digestCutoff(new Date('2026-11-10T00:59:00Z')).toISOString(), '2026-11-09T01:00:00.000Z')
})

test('mốc tóm tắt: từ 8:00 giờ Việt Nam thì lấy 8:00 hôm nay', () => {
  assert.equal(digestCutoff(new Date('2026-11-10T01:00:00Z')).toISOString(), '2026-11-10T01:00:00.000Z')
  assert.equal(digestCutoff(new Date('2026-11-10T20:00:00Z')).toISOString(), '2026-11-10T01:00:00.000Z')
})

test('mốc tóm tắt: qua đầu tháng vẫn đúng', () => {
  assert.equal(digestCutoff(new Date('2026-12-01T00:30:00Z')).toISOString(), '2026-11-30T01:00:00.000Z')
})

test('thư cho doanh nghiệp không chứa tên công ty hay thông tin ứng viên', () => {
  assert.equal(lineOf(item({ kind: 'interest', side: 'recruiter' })), 'Có ứng viên mới ứng tuyển vị trí Pha chế')
})

test('tên tin do người dùng nhập được thoát ký tự trong HTML nhưng giữ nguyên trong bản chữ', () => {
  const mail = composeMail([item({ jobTitle: '<img src=x onerror=alert(1)>' })])
  assert.ok(!mail.html.includes('<img'))
  assert.ok(mail.html.includes('&lt;img'))
  assert.ok(mail.text.includes('<img src=x'))
})

test('một thông báo thì tiêu đề nói rõ việc, nhiều thông báo thì nêu số lượng và gộp phần dư', () => {
  assert.equal(composeMail([item()]).subject, 'Workmate: Quán A mời bạn nhận việc vị trí Pha chế')
  const mail = composeMail(Array.from({ length: 12 }, () => item()))
  assert.equal(mail.subject, 'Workmate: bạn có 12 thông báo mới')
  assert.ok(mail.text.includes('và 2 thông báo khác'))
  assert.equal(mail.text.match(/^- Quán A/gm)?.length, 10)
})

test('liên kết Cài đặt theo đúng vai trò, địa chỉ lấy từ CORS_ORIGIN đầu tiên', () => {
  const saved = process.env.CORS_ORIGIN
  process.env.CORS_ORIGIN = 'https://workmate.vn/, https://www.workmate.vn'
  try {
    assert.ok(composeMail([item()]).text.includes('https://workmate.vn/tim-viec/cai-dat'))
    assert.ok(composeMail([item({ kind: 'review', side: 'recruiter' })]).text.includes('https://workmate.vn/tuyen-dung/cai-dat'))
  } finally {
    if (saved === undefined) delete process.env.CORS_ORIGIN
    else process.env.CORS_ORIGIN = saved
  }
})
