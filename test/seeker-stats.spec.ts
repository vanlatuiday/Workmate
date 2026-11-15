import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bucketWeeks, STATS_WEEKS, vnWeekStart } from '../src/profile/seeker-stats.service'

test('đầu tuần là 0:00 thứ Hai giờ Việt Nam', () => {
  // T2 16/11/2026 10:00 VN = 03:00 UTC → tuần bắt đầu T2 16/11 0:00 VN = 15/11 17:00 UTC
  assert.equal(vnWeekStart(new Date('2026-11-16T03:00:00Z')).toISOString(), '2026-11-15T17:00:00.000Z')
  // CN 15/11 23:30 VN = 16:30 UTC → vẫn thuộc tuần trước (T2 09/11)
  assert.equal(vnWeekStart(new Date('2026-11-15T16:30:00Z')).toISOString(), '2026-11-08T17:00:00.000Z')
})

test('chia vào 8 tuần, tuần cũ trước, bỏ mốc quá cũ', () => {
  const now = new Date('2026-11-16T03:00:00Z') // thứ Hai
  const w = bucketWeeks(now, {
    // CN 15/11 17:00 VN và T4 11/11 → tuần 09/11; tháng 8 → quá cũ
    applied: [new Date('2026-11-15T10:00:00Z'), new Date('2026-11-11T01:00:00Z'), new Date('2026-08-01T00:00:00Z')],
    invited: [new Date('2026-11-03T00:00:00Z')], // T3 → tuần 02/11
    connected: [new Date('2026-11-16T02:00:00Z')], // hôm nay → tuần hiện tại
  })
  assert.equal(w.length, STATS_WEEKS)
  assert.equal(w[STATS_WEEKS - 1].weekStart, '2026-11-16')
  assert.equal(w[STATS_WEEKS - 2].weekStart, '2026-11-09')
  assert.equal(w[STATS_WEEKS - 2].applied, 2)
  assert.equal(w[STATS_WEEKS - 3].invited, 1)
  assert.equal(w[STATS_WEEKS - 1].connected, 1)
  assert.equal(w.reduce((s, x) => s + x.applied, 0), 2)
})
