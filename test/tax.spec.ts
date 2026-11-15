import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isValidTaxCode, namesMatch, normalizeTaxCode } from '../src/tax/tax-code'
import { classifyStatus, MOCK_TAX_CODES, TaxLookupService } from '../src/tax/tax-lookup.service'

test('mã thật công khai đúng số kiểm tra', () => {
  for (const c of ['0100109106', '0300588569', '0100686174']) assert.ok(isValidTaxCode(c), c)
})

test('mã gõ bừa, sai độ dài, có chữ → sai', () => {
  for (const c of ['0123456789', '010010910', '01001091060', '01001O9106', '']) assert.equal(isValidTaxCode(c), false, c)
})

test('mã chi nhánh 10 số + -3 số; chuẩn hóa khoảng trắng và dấu chấm', () => {
  assert.ok(isValidTaxCode('0100109106-001'))
  assert.equal(isValidTaxCode('0100109106-01'), false)
  assert.equal(normalizeTaxCode(' 0100 109.106 '), '0100109106')
})

test('mọi mã trong bảng giả lập đều đúng số kiểm tra', () => {
  for (const c of Object.keys(MOCK_TAX_CODES)) assert.ok(isValidTaxCode(c), c)
})

test('so tên: bỏ loại hình và dấu, khớp tên viết tắt', () => {
  assert.ok(namesMatch('Cà phê Sông Hàn', 'CÔNG TY TNHH CÀ PHÊ SÔNG HÀN'))
  assert.ok(namesMatch('Công ty TNHH Cà Phê Sông Hàn', 'CÔNG TY TNHH CÀ PHÊ SÔNG HÀN'))
  assert.ok(namesMatch('Vinamilk', 'CÔNG TY CỔ PHẦN SỮA VIỆT NAM', 'VINAMILK'))
  assert.equal(namesMatch('Cà phê Sông Hàn', 'CÔNG TY TNHH THƯƠNG MẠI MINH PHÁT'), false)
  assert.equal(namesMatch('Công ty TNHH', 'CÔNG TY TNHH MINH PHÁT'), false)
})

test('trạng thái thuế: chỉ "đang hoạt động" thật sự mới là active', () => {
  assert.equal(classifyStatus('NNT đang hoạt động'), 'active')
  assert.equal(classifyStatus('NNT đang hoạt động (đã được cấp GCN ĐKT)'), 'active')
  assert.equal(classifyStatus('NNT tạm nghỉ kinh doanh có thời hạn'), 'inactive')
  assert.equal(classifyStatus('NNT ngừng hoạt động và đã hoàn thành thủ tục chấm dứt hiệu lực MST'), 'inactive')
  assert.equal(classifyStatus('NNT không hoạt động tại địa chỉ đã đăng ký'), 'inactive')
})

test('chế độ giả lập: đủ các trường hợp', async () => {
  const prev = process.env.TAX_LOOKUP_MODE
  process.env.TAX_LOOKUP_MODE = 'mock'
  try {
    const svc = new TaxLookupService()
    assert.equal((await svc.lookup('0401112222')).result, 'active')
    assert.equal((await svc.lookup('0402223334')).result, 'inactive')
    assert.equal((await svc.lookup('0407778883')).result, 'not_found')
    assert.equal((await svc.lookup('0401112222')).source, 'mock')
  } finally {
    process.env.TAX_LOOKUP_MODE = prev
  }
})
