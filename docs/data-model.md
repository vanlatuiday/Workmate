# Mô hình dữ liệu Workmate (bản nháp để duyệt)

Rút từ các kho demo của frontend (`demoStore`, `profileStore`, `companyStore`, `adminStore`,
`cvStore`, `settingsStore`, `matchStore`, `pages/public/match/data.ts`). Mỗi mục dưới đây sẽ là
một bảng trong PostgreSQL. `[]` = danh sách lưu ngay trong ô (mảng).

## 1. Tài khoản
| Bảng | Lưu gì | Ghi chú |
|---|---|---|
| **users** | email (duy nhất), mật khẩu đã băm, vai trò (người tìm việc / nhà tuyển dụng / admin), trạng thái (hoạt động / bị khóa), ngày tạo | Thay 3 tài khoản demo |
| **password_resets** | mã đặt lại mật khẩu (đã băm), hạn dùng, đã dùng chưa | Cho "Quên mật khẩu" |
| **user_settings** | loại thông báo bật/tắt, email tóm tắt (ngay / hằng ngày / tắt), ai xem được hồ sơ (công khai / chỉ đã kết nối / ẩn) | Trang Cài đặt |

## 2. Người tìm việc
| Bảng | Lưu gì |
|---|---|
| **seeker_profiles** | (1–1 với users) họ tên, SĐT, ảnh đại diện, cho DN thấy ảnh?, giới thiệu ngắn, "về bạn", khu vực, toạ độ, lương tối thiểu (nghìn đ/giờ), khoảng cách tối đa (km), loại việc[], kỹ năng[], lịch rảnh[] (ô "thứ-buổi", 7×3), đã công khai? |
| **seeker_experiences** | chức danh, nơi làm, thời gian — nhiều dòng mỗi người |
| **cvs** | tên file, đường dẫn file, loại, dung lượng, CV mặc định?, ngày tải lên |

## 3. Doanh nghiệp & tin tuyển dụng
| Bảng | Lưu gì |
|---|---|
| **companies** | tên, đường dẫn ngắn (slug), ngành, quận, địa chỉ, quy mô, câu giới thiệu, giới thiệu, môi trường[], giá trị[], chính sách[], văn hoá, email, SĐT, logo, ảnh bìa, đã xác minh?, bị khóa? |
| **company_members** | tài khoản nhà tuyển dụng nào thuộc công ty nào (cho phép 1 công ty nhiều người quản lý về sau) |
| **jobs** | công ty, người đăng, tên vị trí, mô tả, loại việc, quận, địa chỉ, toạ độ, lương min–max (nghìn đ/giờ) + nhãn lương, nhãn ca, ca làm[] (cùng kiểu ô với lịch rảnh), kỹ năng[], số lượng, bán kính tìm (km), ảnh minh họa, trạng thái (đang tuyển / tạm dừng / đã đóng), kiểm duyệt (chờ / đã duyệt / từ chối + lý do), ngày đăng, hạn |

## 4. Kết nối hai chiều (lõi của sản phẩm)
Mọi thứ dưới đây gắn với một **cặp (tin tuyển dụng, người tìm việc)**.

| Bảng | Lưu gì |
|---|---|
| **saved_jobs** | người tìm việc lưu tin nào |
| **candidate_marks** | nhà tuyển dụng lưu / bỏ qua ứng viên nào cho tin nào |
| **interests** | phía nào (người tìm việc = ứng tuyển, DN = quan tâm) bày tỏ, lúc nào |
| **connections** | cặp đã kết nối (cả hai cùng quan tâm), lúc nào |
| **messages** | tin nhắn trong cặp đã kết nối: phía gửi, nội dung, dòng hệ thống?, lúc gửi |
| **conversation_reads** | mỗi người đọc tới đâu trong từng cuộc trò chuyện (để đếm tin chưa đọc) |
| **interviews** | 1–3 khung giờ DN đề xuất, giờ ứng viên chọn, trực tiếp/online, địa điểm, ghi chú, trạng thái (chờ / đã xác nhận / từ chối / huỷ) |
| **hires** | mời nhận việc: trạng thái (đã mời / đã đi làm / từ chối / DN rút / không nhận), ngày bắt đầu, lời nhắn, lý do |
| **reviews** | đánh giá hai chiều sau khi đi làm: phía viết, 1–5 sao, thẻ nhanh[] (≤3), nhận xét (≤300 ký tự) |
| **notifications** | gửi cho ai, loại (quan tâm, kết nối, mời phỏng vấn, xác nhận, nhận việc, đánh giá…), cặp liên quan, đã đọc?, đã xử lý gửi email lúc nào |

## 5. Quản trị
| Bảng | Lưu gì |
|---|---|
| **reports** | báo cáo vi phạm: đối tượng (tin / công ty / người tìm việc), lý do, ghi chú, người báo (hoặc khách), trạng thái, cách xử lý |
| **system_config** | (1 dòng) trọng số chấm điểm phù hợp (kỹ năng 35, lịch 25, lương 16, khoảng cách 14, loại việc 10), từ cấm trong tin, lương tối thiểu, bán kính mặc định, mở đăng ký? |

## Không lưu thành bảng
- **Điểm phù hợp**: tính khi cần từ hồ sơ + tin + `system_config` (như frontend đang làm), không lưu sẵn.
- **Bài cẩm nang / giới thiệu**: tạm để nội dung tĩnh trong frontend.
- **Chế độ xem, chất lượng hiệu ứng**: cài đặt giao diện, giữ trong trình duyệt.

## Dữ liệu mẫu ban đầu
Nạp lại đúng dữ liệu demo hiện có: 3 tài khoản (admin1/admin2/admin3), 13 việc mẫu (m1–m13) của
các công ty mẫu, 4 tin của DN demo (j1–j4), 20 ứng viên mẫu (u1–u20), các quan tâm/kết nối/tin
nhắn/phỏng vấn mẫu — để web chạy thật mà vẫn có nội dung.

## Quyết định đã chốt (2026-11-08)
1. Công ty nhiều người quản lý: giữ `company_members` (trước mắt 1 tài khoản/công ty).
2. Khoảng cách: lưu toạ độ (lat, lng) cho hồ sơ và tin; tạm lấy toạ độ theo quận, sau nối bản đồ.
3. File/ảnh: chuẩn S3. Trên máy dùng SeaweedFS (Docker, 2 bucket workmate-public / workmate-private); lên mạng đổi sang R2/S3 qua biến STORAGE_* (2026-11-08: R2 đòi thẻ nên tạm hoãn; MinIO không còn ảnh Docker).
