import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/components/notifications/notificationGroups.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { groupNotifications } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const now = Date.parse('2026-11-22T17:30:00Z') // 00:30 ngày 23/11 tại Việt Nam
const at = '2026-11-22T16:00:00Z'
const n = (kind, extra = {}) => ({ id: kind, kind, to: 'seeker', jobId: 'job', seekerId: 'me', at, read: false, ...extra })
const iv = (extra = {}) => ({ id: 'iv', jobId: 'job', seekerId: 'me', status: 'pending', slots: ['2026-11-24T01:00:00Z'], createdAt: at, ...extra })
const hire = (extra = {}) => ({ jobId: 'job', seekerId: 'me', status: 'offered', startDate: '2026-11-23', at, updatedAt: at, ...extra })
const group = (extra = {}) => groupNotifications({ viewer: 'seeker', notifications: [], interviews: [], hires: [], interests: [], connections: [], jobs: [], now, ...extra })

test('đã đọc vẫn cần phản hồi khi lời mời còn chờ; xác nhận rồi chuyển sang cập nhật', () => {
  const input = { notifications: [n('interview_invited', { read: true })], interviews: [iv()] }
  assert.equal(group(input).actions.length, 1)
  const settled = group({ ...input, interviews: [iv({ status: 'confirmed' })] })
  assert.equal(settled.actions.length, 0)
  assert.equal(settled.updates.length, 1)
})

test('chỉ đưa khung giờ còn ở tương lai vào thao tác chọn giờ, hết khung giờ thì cập nhật', () => {
  const result = group({ notifications: [n('interview_invited')], interviews: [iv({ slots: ['2026-11-20T01:00:00Z', '2026-11-24T01:00:00Z'] })] })
  assert.deepEqual(result.actions[0].action.interview.slots, ['2026-11-24T01:00:00Z'])
  assert.equal(group({ notifications: [n('interview_invited')], interviews: [iv({ slots: ['2026-11-20T01:00:00Z'] })] }).actions.length, 0)
})

test('không lặp thao tác cho cùng một lời mời và không gắn thông báo cũ với lời mời mới', () => {
  const notifications = [n('interview_invited', { id: 'old', at: '2026-11-21T16:00:00Z' }), n('interview_invited', { id: 'new' }), n('interview_invited', { id: 'duplicate' })]
  const result = group({ notifications, interviews: [iv()] })
  assert.equal(result.actions.length, 1)
  assert.equal(result.updates.length, 2)
  assert.notEqual(result.actions[0].notification.id, 'old')
  assert.equal(group({ notifications: [notifications[0]], interviews: [iv()] }).actions.length, 0)
})

test('lời mời nhận việc dùng ngày Việt Nam; hôm trước hết hiệu lực, hôm nay vẫn chờ', () => {
  const notifications = [n('offer')]
  assert.equal(group({ notifications, hires: [hire()] }).actions.length, 1)
  assert.equal(group({ notifications, hires: [hire({ startDate: '2026-11-22' })] }).actions.length, 0)
  for (const status of ['accepted', 'declined', 'withdrawn', 'rejected']) assert.equal(group({ notifications, hires: [hire({ status })] }).actions.length, 0)
})

test('đã có quyết định nhận việc thì không yêu cầu chọn lại lịch phỏng vấn', () => {
  assert.equal(group({ notifications: [n('interview_invited')], interviews: [iv()], hires: [hire()] }).actions.length, 0)
})

test('phân biệt đúng cặp công việc/ứng viên và đúng phía nhận, thiếu dữ liệu không bịa thao tác', () => {
  assert.equal(group({ notifications: [n('offer')], hires: [hire({ seekerId: 'other' })] }).actions.length, 0)
  assert.equal(group({ notifications: [n('offer')], hires: [hire({ jobId: 'other' })] }).actions.length, 0)
  assert.equal(group({ notifications: [n('offer')] }).updates.length, 1)
  const result = group({ notifications: [n('offer', { to: 'recruiter' })], hires: [hire()] })
  assert.equal(result.actions.length + result.updates.length, 0)
})

test('doanh nghiệp chỉ cần xem hồ sơ chưa xem, chưa kết nối và tin vẫn đang tuyển', () => {
  const input = { viewer: 'recruiter', notifications: [n('interest', { to: 'recruiter' })], interests: [{ jobId: 'job', seekerId: 'me', from: 'seeker', at }], jobs: [{ id: 'job', visible: true }] }
  assert.equal(group(input).actions[0].action.kind, 'application')
  assert.equal(group({ ...input, interests: [{ ...input.interests[0], viewedAt: at }] }).actions.length, 0)
  assert.equal(group({ ...input, connections: [{ jobId: 'job', seekerId: 'me', at }] }).actions.length, 0)
  assert.equal(group({ ...input, jobs: [{ id: 'job', visible: false }] }).actions.length, 0)
  assert.equal(group({ ...input, jobs: [{ id: 'job', visible: true, expiresAt: '2026-11-20T01:00:00Z' }] }).actions.length, 0)
})

test('các sự kiện thông tin nằm ở cập nhật, giữ đủ thông báo và sắp mới trước', () => {
  const notifications = [n('connected'), n('review', { at: '2026-11-22T17:00:00Z' }), n('job_match')]
  const result = group({ notifications })
  assert.equal(result.actions.length, 0)
  assert.equal(result.updates.length, notifications.length)
  assert.equal(result.updates[0].notification.kind, 'review')
})
