import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/pages/public/personal/prepareCover.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { prepareCover } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('chặn định dạng không hỗ trợ và file trên 10MB trước khi giải mã', async () => {
  await assert.rejects(() => prepareCover(new File(['svg'], 'bad.svg', { type: 'image/svg+xml' })), /JPG, PNG hoặc WebP/)
  await assert.rejects(() => prepareCover(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' })), /10 MB/)
})

test('thu nhỏ ảnh lớn, giữ tỉ lệ, xuất WebP và giải phóng ảnh đã giải mã', async () => {
  let closed = false
  let drawing
  const canvas = { width: 0, height: 0,
    getContext: () => ({ drawImage: (...args) => { drawing = args.slice(1) } }),
    toBlob: (callback, type) => callback(new Blob(['compressed'], { type })),
  }
  globalThis.createImageBitmap = async () => ({ width: 4000, height: 2000, close: () => { closed = true } })
  globalThis.document = { createElement: () => canvas }
  const result = await prepareCover(new File(['png'], 'wide.png', { type: 'image/png' }))
  assert.equal(result.type, 'image/webp')
  assert.deepEqual(drawing, [0, 0, 1800, 900])
  assert.equal(canvas.width, 1800)
  assert.equal(canvas.height, 900)
  assert.equal(closed, true)
})

test('không phóng ảnh nhỏ và vẫn giải phóng bộ nhớ khi không xuất được ảnh', async () => {
  let closed = false
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: () => {} }), toBlob: (callback) => callback(null) }
  globalThis.createImageBitmap = async () => ({ width: 300, height: 200, close: () => { closed = true } })
  globalThis.document = { createElement: () => canvas }
  await assert.rejects(() => prepareCover(new File(['jpg'], 'small.jpg', { type: 'image/jpeg' })), /xử lý ảnh/)
  assert.equal(canvas.width, 300)
  assert.equal(canvas.height, 200)
  assert.equal(closed, true)
})
