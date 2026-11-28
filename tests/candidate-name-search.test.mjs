import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/text.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { matchesCandidateName } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('tìm tên đã rút gọn bằng tên gõ đầy đủ hoặc chữ cái đầu', () => {
  assert.equal(matchesCandidateName('Nguyễn M. A.', 'Nguyen   Minh Anh'), true)
  assert.equal(matchesCandidateName('Nguyễn M. A.', 'nguyen m a'), true)
  assert.equal(matchesCandidateName('Nguyễn M. A.', 'Minh Anh'), true)
  assert.equal(matchesCandidateName('Nguyễn M. A.', 'Nguyen Minh Bao'), false)
})

test('tên hiển thị đầy đủ khớp theo chữ đã gõ và bỏ dấu tiếng Việt', () => {
  assert.equal(matchesCandidateName('Đặng Minh Anh', 'dang minh anh'), true)
  assert.equal(matchesCandidateName('Đặng Minh Anh', 'anh'), true)
  assert.equal(matchesCandidateName('Đặng Minh Anh', 'dang manh anh'), false)
})
