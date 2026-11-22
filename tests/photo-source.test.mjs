import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const compile = (source) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}
const format = compile(await readFile(new URL('../src/utils/format.ts', import.meta.url), 'utf8'))
const source = await readFile(new URL('../src/components/discover/types.ts', import.meta.url), 'utf8')
const { photoUrl, photoSrcSet } = await import(compile(source.replace('@utils/format', format)))

test('ảnh tải lên giữ nguyên URL và không tạo các kích thước giả', () => {
  const url = 'https://cdn.example.com/company/cover.webp?signature=abc&w=original'
  const photo = { url, alt: 'Ảnh doanh nghiệp' }
  assert.equal(photoUrl(photo, 960), url)
  assert.equal(photoUrl({ ...photo, id: '1501339847302-ac426a4a7cbb' }, 160), url)
  assert.equal(photoSrcSet(photo), undefined)
  assert.equal(photoUrl(url, 640), url)
})

test('ảnh tài nguyên trong ứng dụng và URL http được dùng trực tiếp', () => {
  for (const url of ['/assets/company.webp', './images/cover.png', '../images/cover.jpg', 'assets/cover.webp', 'http://localhost:3000/uploads/cover.png']) {
    assert.equal(photoUrl({ url, alt: '' }, 640), url)
    assert.equal(photoSrcSet({ url, alt: '' }), undefined)
  }
})

test('ảnh mẫu tiếp tục hỗ trợ Photo và id cũ cùng srcSet đúng kích thước', () => {
  const id = '1501339847302-ac426a4a7cbb'
  const expected = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=640&q=75&auto=format&fit=crop'
  assert.equal(photoUrl(id, 640), expected)
  assert.equal(photoUrl({ id, alt: '' }, 640), expected)
  assert.equal(photoSrcSet({ id, alt: '' }), [
    `${expected} 640w`,
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=960&q=75&auto=format&fit=crop 960w',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1400&q=75&auto=format&fit=crop 1400w',
  ].join(', '))
})

test('thiếu ảnh hoặc URL không an toàn không tạo URL ảnh lỗi', () => {
  for (const photo of [undefined, { alt: '' }, { url: '', alt: '' }, { url: 'javascript:alert(1)', alt: '' }, { url: '//other.example/cover.jpg', alt: '' }, { url: 'data:image/png;base64,a', alt: '' }, { url: 'https://', alt: '' }, { url: '/\\other.example/cover.jpg', alt: '' }]) {
    assert.equal(photoUrl(photo, 640), undefined)
    assert.equal(photoSrcSet(photo), undefined)
  }
  assert.equal(photoUrl({ url: 'javascript:alert(1)', id: '1501339847302-ac426a4a7cbb', alt: '' }, 640), 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=640&q=75&auto=format&fit=crop')
})
