import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/pages/public/personal/companyRecruitingJobs.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { companyRecruitingJobs } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const now = Date.parse('2026-11-22T08:00:00Z')
const job = (id, changes = {}) => ({
  id, companyId: 'target', title: 'Phục vụ', district: 'Hải Châu', distanceKm: 2,
  salaryLabel: '30.000đ/giờ', shiftLabel: 'Ca sáng', photo: { id: 'photo', alt: 'Quán' },
  skills: [], requiredSkills: [], requireAllSlots: false, slots: [], salaryMinK: 30,
  salaryMaxK: 30, jobType: 'part-time', description: '', quantity: 1, radiusKm: 8,
  postedAt: '2026-11-21T08:00:00Z', status: 'open', moderation: 'approved', visible: true,
  ...changes,
})

test('chỉ lấy tin của công ty đang xem, công khai, đang mở và đã duyệt', () => {
  const jobs = [
    job('valid'), job('other', { companyId: 'other' }), job('hidden', { visible: false }),
    job('paused', { status: 'paused' }), job('closed', { status: 'closed' }),
    job('pending', { moderation: 'pending' }), job('rejected', { moderation: 'rejected' }),
    job('moderation-hidden', { moderation: 'hidden' }),
  ]
  assert.deepEqual(companyRecruitingJobs(jobs, 'target', now).map((j) => j.id), ['valid'])
  assert.deepEqual(companyRecruitingJobs(jobs, 'missing', now), [])
})

test('giữ tin không có hạn hoặc chưa hết hạn, loại hạn bằng hiện tại và hạn không hợp lệ', () => {
  const jobs = [
    job('no-deadline'), job('future', { expiresAt: '2026-11-22T08:00:00.001Z' }),
    job('equal', { expiresAt: '2026-11-22T08:00:00Z' }),
    job('past', { expiresAt: '2026-11-22T07:59:59Z' }),
    job('invalid', { expiresAt: 'không phải ngày' }), job('empty', { expiresAt: '' }),
  ]
  assert.deepEqual(companyRecruitingJobs(jobs, 'target', now).map((j) => j.id), ['no-deadline', 'future'])
})

test('xếp tin mới trước, giữ thứ tự ngày bằng nhau và không đổi mảng nguồn', () => {
  const jobs = Object.freeze([
    job('old', { postedAt: '2026-11-20T08:00:00Z' }),
    job('new', { postedAt: '2026-11-22T07:00:00Z' }),
    job('same-date', { postedAt: '2026-11-22T07:00:00Z' }),
    job('invalid-date', { postedAt: 'không phải ngày' }),
  ])
  const result = companyRecruitingJobs(jobs, 'target', now)
  assert.deepEqual(result.map((j) => j.id), ['new', 'same-date', 'old', 'invalid-date'])
  assert.deepEqual(jobs.map((j) => j.id), ['old', 'new', 'same-date', 'invalid-date'])
  assert.equal(result[0], jobs[1])
})
