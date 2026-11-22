import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import { create } from 'zustand'
import ts from 'typescript'

const source = await readFile(new URL('../src/context/companyStore.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const profile = (name) => ({
  name, industry: 'Dịch vụ', district: 'Hải Châu', size: '11-50', foundedYear: null,
  tagline: '', about: '', environment: [], values: [], policies: [], culture: '',
  email: '', phone: '', cover: { id: 'cover', alt: 'Ảnh bìa' },
})
const server = (id, name) => ({ id, ...profile(name), logoUrl: `/${id}.webp`, address: `Địa chỉ ${name}` })

// Dùng Zustand thật; chỉ thay API để chủ động trả phản hồi sau khi đổi phiên.
function pendingUpdate() {
  let resolve, reject
  const response = new Promise((yes, no) => { resolve = yes; reject = no })
  const exports = {}
  const dependencies = {
    zustand: { create },
    '@services/api': { default: { patch: () => response } },
    '@utils/isProduction': { IS_PRODUCTION: true },
    '@pages/public/personal/companyData': { COMPANY: { ...profile(''), recruiter: { email: '' } } },
  }
  new Function('require', 'exports', outputText)((name) => {
    assert.ok(name in dependencies, `Phụ thuộc chưa được chuẩn bị: ${name}`)
    return dependencies[name]
  }, exports)
  const store = exports.useCompanyStore
  store.setState({ id: 'first', loaded: true, profile: profile('Công ty ban đầu') })
  return { store, resolve, reject }
}

test('cập nhật bình thường nhận hồ sơ và trạng thái máy chủ, giữ đúng id công ty', async () => {
  const { store, resolve } = pendingUpdate()
  const saving = store.getState().update({ name: 'Tên đã đổi' })
  assert.equal(store.getState().profile.name, 'Công ty ban đầu')
  resolve({ data: server('first', 'Tên chuẩn hóa từ máy chủ') })
  await saving
  assert.deepEqual(store.getState().profile, profile('Tên chuẩn hóa từ máy chủ'))
  assert.equal(store.getState().id, 'first')
  assert.equal(store.getState().address, 'Địa chỉ Tên chuẩn hóa từ máy chủ')
  assert.equal(store.getState().logoUrl, '/first.webp')
})

test('phản hồi lưu đến sau đăng xuất không khôi phục hồ sơ của phiên cũ', async () => {
  const { store, resolve } = pendingUpdate()
  const saving = store.getState().update({ name: 'Tên phiên cũ' })
  store.getState().clear()
  const afterLogout = store.getState()
  resolve({ data: server('first', 'Tên phiên cũ') })
  await saving
  assert.equal(store.getState(), afterLogout)
  assert.equal(store.getState().id, '')
  assert.equal(store.getState().profile.name, '')
})

test('phản hồi phiên trước không ghi đè phiên mới dù nạp lại cùng id công ty', async () => {
  const { store, resolve } = pendingUpdate()
  const saving = store.getState().update({ name: 'Tên phiên cũ' })
  store.getState().clear()
  store.setState({ id: 'first', loaded: true, profile: profile('Hồ sơ phiên mới'), address: 'Địa chỉ mới', logoUrl: '/new.webp' })
  const newSession = store.getState()
  resolve({ data: server('first', 'Tên phiên cũ') })
  await saving
  assert.equal(store.getState(), newSession)
  assert.equal(store.getState().profile.name, 'Hồ sơ phiên mới')
})

test('phản hồi lưu không ghi vào công ty khác đang có trong store', async () => {
  const { store, resolve } = pendingUpdate()
  const saving = store.getState().update({ name: 'Tên công ty cũ' })
  store.setState({ id: 'second', loaded: true, profile: profile('Công ty khác'), address: 'Địa chỉ khác', logoUrl: '/second.webp' })
  const otherCompany = store.getState()
  resolve({ data: server('first', 'Tên công ty cũ') })
  await saving
  assert.equal(store.getState(), otherCompany)
  assert.equal(store.getState().id, 'second')
})

test('máy chủ từ chối lưu thì giữ hồ sơ cũ và trả lỗi cho popup', async () => {
  const { store, reject } = pendingUpdate()
  const before = store.getState()
  const error = new Error('Máy chủ từ chối')
  const saving = store.getState().update({ name: 'Tên không hợp lệ' })
  reject(error)
  await assert.rejects(saving, (actual) => actual === error)
  assert.equal(store.getState(), before)
})
