import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/pages/public/schedule/data.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { getScheduleData, dayKey, whenOf } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const now = Date.parse('2026-11-22T00:00:00Z')
const interview = (id, status, time) => ({ id, status, slots: [time], chosen: status === 'confirmed' ? time : undefined, createdAt: '2026-11-20T00:00:00Z' })

test('lịch sắp tới theo giờ tăng dần; giữ đúng ba nhóm trạng thái và không đổi dữ liệu nguồn', () => {
  const all = Object.freeze([
    interview('later', 'confirmed', '2026-11-24T02:00:00Z'),
    interview('cancelled', 'cancelled', '2026-11-25T02:00:00Z'),
    interview('pending', 'pending', '2026-11-23T02:00:00Z'),
    interview('earlier', 'confirmed', '2026-11-23T01:00:00Z'),
    interview('past', 'confirmed', '2026-11-21T02:00:00Z'),
    interview('declined', 'declined', '2026-11-24T02:00:00Z'),
  ])
  const result = getScheduleData(all, now)
  assert.deepEqual(result.upcoming.map((iv) => iv.id), ['earlier', 'later'])
  assert.deepEqual(result.pending.map((iv) => iv.id), ['pending'])
  assert.deepEqual(result.past.map((iv) => iv.id), ['cancelled', 'declined', 'past'])
  assert.equal(result.upcoming[0], all[3])
  assert.equal(all[0].id, 'later')
})

test('nhóm ngày theo giờ Việt Nam, dùng giờ đã chọn thay cho khung đề xuất đầu tiên', () => {
  const all = [
    { ...interview('second', 'confirmed', '2026-11-22T01:00:00Z'), chosen: '2026-11-22T18:30:00Z' },
    interview('first', 'confirmed', '2026-11-22T17:30:00Z'),
    interview('previous-day', 'confirmed', '2026-11-22T16:30:00Z'),
  ]
  const { groups } = getScheduleData(all, now)
  assert.equal(dayKey('2026-11-22T18:00:00Z'), '2026-11-23')
  assert.deepEqual(groups.map((g) => [g.key, g.list.map((iv) => iv.id)]), [
    ['2026-11-22', ['previous-day']], ['2026-11-23', ['first', 'second']],
  ])
  assert.equal(whenOf(all[0]), '2026-11-22T18:30:00Z')
})

test('giữ lịch chờ đã hết khung giờ trong nhóm chờ, rỗng không tạo lịch giả', () => {
  const expired = interview('expired', 'pending', '2026-11-21T01:00:00Z')
  assert.deepEqual(getScheduleData([expired], now).pending, [expired])
  assert.deepEqual(getScheduleData([], now), { upcoming: [], pending: [], past: [], groups: [] })
})
