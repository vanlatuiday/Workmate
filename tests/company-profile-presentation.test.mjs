import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/pages/public/personal/companyProfilePresentation.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { companyRecruitmentFacts, companyProfileItems } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('hình thức, ca và khu vực chỉ lấy từ tin được truyền vào, bỏ trống và trùng lặp', () => {
  const jobs = Object.freeze([
    { jobType: 'part-time', shiftLabel: ' Ca sáng ', district: 'Hải Châu' },
    { jobType: 'part-time', shiftLabel: 'Ca sáng', district: ' Hải Châu ' },
    { jobType: 'shift', shiftLabel: 'Ca tối', district: 'Sơn Trà' },
    { jobType: 'full-time', shiftLabel: ' ', district: '' },
  ])
  assert.deepEqual(companyRecruitmentFacts(jobs), {
    jobTypes: ['part-time', 'shift', 'full-time'], shifts: ['Ca sáng', 'Ca tối'], districts: ['Hải Châu', 'Sơn Trà'],
  })
  assert.equal(jobs[0].shiftLabel, ' Ca sáng ')
})

test('không có tin thì mọi nhóm tuyển dụng trống, không thêm tiêu chí mẫu', () => {
  assert.deepEqual(companyRecruitmentFacts([]), { jobTypes: [], shifts: [], districts: [] })
})

test('giữ toàn bộ nội dung phúc lợi và văn hóa thật, bỏ dòng trắng và trùng mà không cắt còn năm mục', () => {
  assert.deepEqual(companyProfileItems(undefined), [])
  assert.deepEqual(companyProfileItems([' ', 'Bảo hiểm', ' Bảo hiểm ', 'Đào tạo', 'Ăn ca', 'Thưởng', 'Nghỉ phép', 'Du lịch']),
    ['Bảo hiểm', 'Đào tạo', 'Ăn ca', 'Thưởng', 'Nghỉ phép', 'Du lịch'])
})
