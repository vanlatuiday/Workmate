import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/components/jobs/jobDetailHref.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { jobDetailHref } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('mở tin trên trang hiện tại và giữ bộ lọc cùng neo', () => {
  const location = { pathname: '/cong-ty/song-han', search: '?quan=H%E1%BA%A3i+Ch%C3%A2u', hash: '#viec-dang-tuyen' }
  assert.equal(jobDetailHref('m11', location), '/cong-ty/song-han?quan=H%E1%BA%A3i+Ch%C3%A2u&tin=m11#viec-dang-tuyen')
  assert.equal(location.search, '?quan=H%E1%BA%A3i+Ch%C3%A2u')
})

test('thay tin trong popup và mã hóa id an toàn', () => {
  const href = jobDetailHref('a/b?c&d', { pathname: '/tim-viec', search: '?tin=old&q=abc', hash: '' })
  const params = new URL(href, 'http://localhost').searchParams
  assert.equal(params.get('tin'), 'a/b?c&d')
  assert.equal(params.getAll('tin').length, 1)
  assert.equal(params.get('q'), 'abc')
})

test('đóng chỉ bỏ tham số tin và giữ các điều kiện khác', () => {
  assert.equal(jobDetailHref(null, { pathname: '/viec-lam', search: '?q=pha+che&tin=m11&gan=1', hash: '' }), '/viec-lam?q=pha+che&gan=1')
  assert.equal(jobDetailHref(null, { pathname: '/viec-lam', search: '?tin=m11', hash: '' }), '/viec-lam')
})
