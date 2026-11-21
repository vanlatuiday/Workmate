import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/pages/public/personal/seekerWorkHistory.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { seekerWorkHistory } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const hire = (jobId, status = 'accepted', seekerId = 'owner') => ({ jobId, status, seekerId, updatedAt: '2026-11-22T00:00:00Z' })

test('chỉ tính việc đã xác nhận của chính tài khoản, nhiều vị trí cùng công ty chỉ tính một công ty', () => {
  const result = seekerWorkHistory('owner', [hire('a'), hire('b'), hire('c', 'offered'), hire('d', 'declined'), hire('e', 'withdrawn'), hire('f', 'rejected'), hire('g', 'accepted', 'other')],
    [{ id: 'a', companyId: 'company' }, { id: 'b', companyId: 'company' }], [{ id: 'company', name: 'Công ty thật' }], [])
  assert.equal(result.history.length, 2)
  assert.equal(result.companyCount, 1)
  assert.equal(result.missingCompany, false)
  assert.equal(result.average, null)
})

test('tính sao từ toàn bộ đánh giá và gộp thẻ điểm mạnh, giữ nguyên sao từng vị trí', () => {
  const reviews = [{ jobId: 'a', stars: 5, tags: ['Đúng giờ', 'Chủ động'] }, { jobId: 'b', stars: 2, tags: ['Đúng giờ'] }]
  const result = seekerWorkHistory('owner', [hire('a')], [], [], reviews)
  assert.equal(result.average, 3.5)
  assert.deepEqual(result.strengths, ['Đúng giờ', 'Chủ động'])
  assert.equal(result.history[0].review.stars, 5)
})

test('thiếu danh mục không bịa tên hoặc đếm mỗi tin thành một công ty', () => {
  const result = seekerWorkHistory('owner', [hire('deleted-job')], [], [], [])
  assert.equal(result.missingCompany, true)
  assert.equal(result.companyCount, 0)
  assert.equal(result.history[0].company, undefined)
})

test('giữ việc bắt đầu trong tương lai là xác nhận nhận việc, không biến thành ca hoàn thành', () => {
  const result = seekerWorkHistory('owner', [{ ...hire('future'), startDate: '2099-01-01' }], [], [], [])
  assert.equal(result.history.length, 1)
  assert.equal(result.history[0].hire.startDate, '2099-01-01')
  assert.equal(result.completedShifts, undefined)
})
