# Tra mã số doanh nghiệp

Doanh nghiệp nhập mã số doanh nghiệp (= mã số thuế) ở Hồ sơ công ty. Máy chủ:

1. Kiểm tra định dạng (10 số, chi nhánh thêm `-001`…) và **số kiểm tra** (chữ số thứ 10): mã gõ bừa bị từ chối ngay, không cần mạng.
2. Tra mã (`src/tax/tax-lookup.service.ts`) và lưu kết quả vào `Company.taxLookup`.
   - `active` đang hoạt động · `inactive` ngừng / tạm nghỉ / đã đóng mã · `not_found` không có · `unavailable` không tra được lúc đó.
3. Gửi xác minh: phải có mã; tra lại ngay lúc gửi. `not_found` / `inactive` → chặn. `unavailable` → vẫn cho gửi, admin kiểm tra tay.
4. Admin thấy ở hàng chờ xác minh: kết quả tra, tên có khớp không, công ty khác dùng cùng mã (nghi mạo danh).
5. Công khai: `taxValid` = mã đang hoạt động (huy hiệu "Mã số hợp lệ"), khác `verified` (admin đã duyệt giấy tờ).

Tra mã **không** chứng minh người đăng ký là người của công ty đó; bước xem giấy tờ vẫn cần.

## Nguồn tra

- Mặc định: `api.vietqr.io/v2/business/{mã}` — miễn phí, không cần khóa, dữ liệu tổng hợp từ trang Cục Thuế (có thể chậm vài ngày). Dịch vụ của bên thứ ba: lỗi thì kết quả là `unavailable`, web vẫn chạy. Kết quả lưu đệm 6 giờ (không tồn tại: 10 phút).
- `TAX_LOOKUP_MODE="mock"`: bảng giả lập để demo trên máy. Production không cho dùng (`common/production-check.ts`).

## Bảng giả lập (`MOCK_TAX_CODES`)

| Mã số | Kết quả | Dùng để demo |
|---|---|---|
| `0401112222` | Đang hoạt động — CÔNG TY TNHH NHÓM DỊCH VỤ SÔNG HÀN | Trường hợp tốt; khớp tên công ty demo của admin2 ("Nhóm Dịch Vụ Sông Hàn") |
| `0402223334` | Ngừng hoạt động, đã đóng mã | Bị chặn gửi xác minh |
| `0403334446` | Tạm nghỉ kinh doanh | Bị chặn gửi xác minh |
| `0404445558` | Đang hoạt động — CÔNG TY TNHH THƯƠNG MẠI MINH PHÁT | Tên khác tên công ty đã nhập → cảnh báo admin |
| `0406667771` | Đang hoạt động — CÔNG TY TNHH BÁN LẺ HÀN GIANG | Nhập cùng mã cho hai công ty → cờ trùng mã |
| `0407778883` | Không tồn tại (đúng số kiểm tra nhưng không có trong bảng) | Bị chặn |
| `0123456789` | Sai số kiểm tra | Báo lỗi ngay khi nhập |

Mã thật công khai để thử chế độ tra thật: `0100109106` (Viettel), `0300588569` (Vinamilk), `0100686174` (Agribank). Chỉ dùng để thử trên máy; không gắn mã của công ty thật cho tài khoản demo trên web chạy thật.

## API

- `GET /api/recruiter/company/tax-lookup?code=…` — tra thử trước khi lưu → `{ taxCode, lookup, nameMatches, usedByOther }`. 400 nếu sai số kiểm tra. Giới hạn 15/phút, 100/giờ mỗi IP.
- `PATCH /api/recruiter/company` với `taxCode` (chuỗi rỗng = xóa). Đã xác minh và đã có mã thì không đổi được (403); công ty xác minh từ trước khi có mã được nhập lần đầu.
- `GET /api/recruiter/company` trả thêm `taxCode`, `taxLookup`, `taxNameMatches`.
- `GET /api/admin/verifications` mỗi dòng có `tax: { lookup, nameMatches, sameCodeCompanies }`.
