import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DAILY_CAP, pickWithinCap, vnDayStart, type Candidate } from '../src/matching/match-alert.service'
import { scoreMatch, UNMET_SCORE_CAP, type JobRequirement, type SeekerCriteria, type Weights } from '../src/matching/score'

const W: Weights = { skills: 35, schedule: 25, salary: 16, distance: 14, jobType: 10 }
const seeker = (over: Partial<SeekerCriteria> = {}): SeekerCriteria => ({
  skills: ['Pha chế', 'Thu ngân'], slots: ['0-2', '1-2', '2-2'], salaryMinK: 25, maxDistanceKm: 5, jobTypes: ['part_time'], ...over,
})
const job = (over: Partial<JobRequirement> = {}): JobRequirement => ({
  skills: ['Pha chế'], slots: ['0-2', '1-2'], salaryMinK: 25, salaryMaxK: 30, jobType: 'part_time', requiredSkills: [], requireAllSlots: false, ...over,
})

test('khớp đủ mọi tiêu chí → 100', () => {
  assert.equal(scoreMatch(seeker(), job(), 2, W).score, 100)
})

test('kỹ năng so không phân biệt hoa thường, khoảng trắng', () => {
  assert.equal(scoreMatch(seeker({ skills: [' pha CHẾ '] }), job(), 2, W).results[0].value, 1)
})

test('thiếu nửa kỹ năng, nửa ca, xa gấp rưỡi bán kính: cộng điểm theo trọng số', () => {
  const r = scoreMatch(seeker({ skills: ['Pha chế'], slots: ['0-2'] }), job({ skills: ['Pha chế', 'Phục vụ'] }), 7, W)
  // 35·0.5 + 25·0.5 + 16 + 14·0.5 + 10 = 63
  assert.equal(r.score, 63)
  assert.deepEqual(r.missingSkills, ['Phục vụ'])
})

test('xa hơn gấp đôi bán kính: khoảng cách 0 điểm', () => {
  assert.equal(scoreMatch(seeker(), job(), 11, W).score, 86)
})

test('lương tối đa của tin thấp hơn mong muốn và khác loại việc', () => {
  assert.equal(scoreMatch(seeker({ salaryMinK: 40, jobTypes: ['shift'] }), job(), 2, W).score, 74)
})

test('thiếu kỹ năng bắt buộc → điểm bị chặn ở 39 kèm lý do', () => {
  const r = scoreMatch(seeker({ skills: ['Thu ngân'] }), job({ skills: ['Pha chế', 'Thu ngân'], requiredSkills: ['Pha chế'] }), 2, W)
  assert.equal(r.score, UNMET_SCORE_CAP)
  assert.deepEqual(r.unmet, ['Kỹ năng Pha chế'])
  assert.equal(r.results[0].note, 'Thiếu bắt buộc: Pha chế')
})

test('yêu cầu rảnh đủ mọi ca', () => {
  const r = scoreMatch(seeker({ slots: ['0-2'] }), job({ requireAllSlots: true }), 2, W)
  assert.equal(r.score, UNMET_SCORE_CAP)
  assert.deepEqual(r.unmet, ['Rảnh đủ mọi ca'])
})

test('tin không yêu cầu kỹ năng / ca nào thì hai tiêu chí đó đủ điểm', () => {
  assert.equal(scoreMatch(seeker({ skills: [], slots: [] }), job({ skills: [], slots: [] }), 2, W).score, 100)
})

test('đầu ngày giờ Việt Nam', () => {
  // 06:30 ngày 13 giờ VN = 23:30 UTC ngày 12 → 0:00 ngày 13 giờ VN = 17:00 UTC ngày 12
  assert.equal(vnDayStart(new Date('2026-11-12T23:30:00Z')).toISOString(), '2026-11-12T17:00:00.000Z')
  // 23:59 ngày 12 giờ VN = 16:59 UTC ngày 12
  assert.equal(vnDayStart(new Date('2026-11-12T16:59:00Z')).toISOString(), '2026-11-11T17:00:00.000Z')
})

const c = (userId: string, jobId: string, score: number, seekerId = 's1'): Candidate => ({ userId, kind: 'job_match', jobId, seekerId, score })

test(`giới hạn ${DAILY_CAP} thông báo/người/ngày, điểm cao trước`, () => {
  const out = pickWithinCap([c('u1', 'j1', 81), c('u1', 'j2', 95), c('u1', 'j3', 90), c('u1', 'j4', 85), c('u2', 'j1', 80)], new Map(), new Set())
  assert.deepEqual(out.filter((x) => x.userId === 'u1').map((x) => x.jobId), ['j2', 'j3', 'j4'])
  assert.equal(out.filter((x) => x.userId === 'u2').length, 1)
})

test('trừ số đã nhận hôm nay, bỏ cặp đã báo và cặp trùng', () => {
  const out = pickWithinCap(
    [c('u1', 'j1', 99), c('u1', 'j2', 90), c('u1', 'j2', 90), c('u1', 'j3', 85)],
    new Map([['u1', 2]]),
    new Set(['u1|job_match|j1|s1']),
  )
  assert.deepEqual(out.map((x) => x.jobId), ['j2'])
})

test('đã đủ hạn mức hôm nay thì không gửi thêm', () => {
  assert.equal(pickWithinCap([c('u1', 'j1', 99)], new Map([['u1', DAILY_CAP]]), new Set()).length, 0)
})
