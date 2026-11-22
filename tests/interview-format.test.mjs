import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/components/interview/format.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { fmtSlot } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('hộp chọn giờ có thể hiển thị cùng giờ Việt Nam với trang lịch dù trình duyệt ở múi giờ khác', () => {
  const previous = process.env.TZ
  try {
    process.env.TZ = 'America/New_York'
    const iso = '2026-11-23T02:00:00Z'
    assert.match(fmtSlot(iso, 'Asia/Ho_Chi_Minh'), /09:00/)
    assert.match(fmtSlot(iso, 'Asia/Ho_Chi_Minh'), /23\/11/)
    assert.match(fmtSlot(iso), /21:00/)
    assert.match(fmtSlot(iso), /22\/11/)
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})
