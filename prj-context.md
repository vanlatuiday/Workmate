# Workmate — Bối cảnh dự án

> Tài liệu cho phiên Claude / người mới vào dự án. Đọc file này trước khi sửa code.
> Cập nhật lần cuối: 2026-10-30 (hồ sơ lưu, nhận việc, dashboard NTD đọc kho chung) · trước đó 2026-10-23 (dashboard 3 vai trò, liên kết theo vai trò, dọn component cũ). Khi trạng thái tính năng thay đổi, sửa lại mục 3, 6, 7, 8.
>
> Quy ước trong file: **[có]** = đã có trong code · **[khung]** = có route/type/service
> nhưng UI chưa làm · **[chưa rõ]** = chưa có quyết định, đừng tự giả định.

---

## 1. Workmate là gì

Nền tảng **việc làm linh hoạt** cho sinh viên và người lao động tại Việt Nam
(dữ liệu mẫu hiện tập trung ở Đà Nẵng). Khẩu hiệu: *“Tìm việc vừa khít với cuộc sống
bạn đang sống.”*

Khác biệt cốt lõi so với trang tuyển dụng thông thường:

1. **Matching theo đời sống, không chỉ theo CV.** Lịch rảnh trong tuần, khoảng cách
   đi làm, mức lương mong muốn là **điều kiện**, không phải tiêu chí phụ.
2. **Điểm phù hợp (match score)** cho từng cặp ứng viên – việc làm, kèm phân rã lý do.
3. **Kết nối hai chiều (“MATCH”).** Chỉ khi cả ứng viên và nhà tuyển dụng cùng bày tỏ
   quan tâm thì kênh chat riêng mới mở. Không “rải CV”.
4. Thông điệp thương hiệu: *đo thành công bằng số người thật sự đi làm, không bằng số
   tin đăng.*

Hình thức việc làm hỗ trợ (`JobType`): toàn thời gian, bán thời gian, theo ca, thời vụ,
linh hoạt, sự kiện, cộng tác viên.

**[chưa rõ]** Mô hình kinh doanh / thu phí (gói tin đăng, phí nhà tuyển dụng…) — chưa có
dấu vết trong code. Các con số trên trang (2.400+ việc, 850+ nhà tuyển dụng…) từng xuất
hiện là **số minh họa**, không phải số liệu thật.

## 2. Người dùng và vai trò

| Vai trò | Khu vực | Mục tiêu |
|---|---|---|
| Khách (chưa đăng nhập) | `/`, `/viec-lam`, `/cong-ty`, `/cam-nang` | Tìm việc, xem tin, đăng ký |
| Ứng viên `jobseeker` | `/tim-viec/*` | Hồ sơ + lịch rảnh → nhận gợi ý → match → chat → phỏng vấn |
| Nhà tuyển dụng `recruiter` | `/tuyen-dung/*` | Đăng tin có tiêu chí → xem ứng viên phù hợp → match → phỏng vấn |
| Quản trị `admin` | `/admin/*` | Xác minh doanh nghiệp, kiểm duyệt, báo cáo, cấu hình |

Phân quyền: `ProtectedRoute` chỉ kiểm tra `user.role` trong Zustand store
(persist localStorage key `workmate-auth`). Sai role → về `/`; chưa đăng nhập → `/dang-nhap`.

## 3. Tính năng — trạng thái hiện tại

### Công khai
> **Chuyển trang công khai** (2026-10-29, `components/motion/PageTransition.tsx`): đổi route → trang cũ mờ đi nhanh (0.2s), trang mới trượt từ trên xuống 32px + hiện dần (0.55s, bắt đầu sau 2 khung hình để không bị khung đơ lúc mount làm nhảy cóc; trang chủ chỉ hiện dần); tiêu đề trang mới trồi lên theo từng chữ (`usePageEnterDelay` + `TextReveal` ở Việc làm, Kết nối, Đăng nhập, Đăng ký). `CurvedGallery` ở /match đợi trang trượt xong mới khởi động WebGL và đưa ảnh lên GPU mỗi khung một tấm. Màn `PageCurtain` (mở chi tiết — có tên ở giữa; Trang cá nhân — kéo xuống, không chữ) vẫn giữ, tô theo màu nền trang đích (`curtainColors`) và có đường kẻ đậm ở mép khi hai trang cùng màu (`CurtainEdges`). Header: gạch chân mục đang chọn trượt (`layoutId`), màu chuyển dần (`.header-theme`, `@property --page-bg`); bên phải là nút tài khoản `AccountMenu` (khu làm việc / Trang cá nhân / Đăng xuất), khách chỉ "Đăng nhập / Đăng ký"; menu giữa tối đa 3 mục. Dashboard: nội dung hiện dần khi đổi mục (`.dash-enter`), vạch tải mảnh khi trang đang tải.

| Route | Trạng thái |
|---|---|
| `/` Trang chủ | **[có]** Hoàn chỉnh về trải nghiệm (xem mục 5). Nội dung là placeholder. |
| `/viec-lam` | **[có]** (2026-10-24) Bộ sưu tập ảnh điều khiển bằng cuộn, khác nhau theo vai trò: khách/admin → các nơi đang tuyển (`jobs/GuestJobs`), người tìm việc → công ty + việc tiêu biểu (`jobs/JobseekerJobs`), NTD → tin của mình, bấm ảnh mở Ứng viên phù hợp (`jobs/RecruiterJobs`). Engine dùng chung `components/discover` (`ScrollGallery` desktop ≥lg: sticky + ScrollTrigger scrub, tự trôi về ảnh gần nhất khi ngừng cuộn; `StaticGallery` cho mobile/giảm chuyển động). Khách và người tìm việc có thanh tìm kiếm/lọc ở đầu trang (`jobs/JobSearchBar`: từ khóa, quận, loại việc, lương từ, "Gần tôi" chỉ cho người tìm việc), lưu trong URL (`?q=&quan=&loai=&luong=&gan=1`) và nhận cả tham số cũ của ô tìm kiếm trang chủ (`keyword`, `city`, `type`, `nearMe`); bộ sưu tập chỉ còn công ty có việc khớp. **Một nguồn việc + một cách tính điểm: `jobs/catalog.ts`** (`getAllJobs()`/`useAllJobs()` — chỉ tin đang hiện sau kiểm duyệt, `jobsOfCompany`, `seekerOutcome` = 5 tiêu chí của `match/score.ts`); `/viec-lam`, `/cong-ty`, Kết nối và dashboard người tìm việc (Tổng quan, Việc phù hợp) đều dùng chung nên số việc và điểm không lệch nhau. Ảnh Unsplash nạp từ CDN. |
| `/cong-ty/:id` | **[có]** Trang chi tiết kiểu case study (`components/discover/detail/*`). Khách/admin: xen kẽ công ty và người ứng tuyển ẩn danh (APPLICANTS mẫu); người tìm việc/NTD: chỉ phía công ty + việc đang tuyển. Vào từ `/viec-lam` qua màn chuyển cảnh `PageCurtain` (tấm màn màu nền trang đích + tên, `useCurtainNavigate`/`CurtainLink`); nút quay lại dùng lịch sử để giữ vị trí. |
| `/vi-tri/:id` | **[có]** Chỉ NTD (ProtectedRoute trong PublicLayout): chi tiết tin + ứng viên gợi ý (MOCK_CANDIDATES), link sang khu tuyển dụng. |
| `/dang-tin` | **[có]** (2026-10-29) Chỉ NTD (ProtectedRoute trong PublicLayout). Soạn trái + xem trước phải (`pages/public/PostJobPage.tsx`, `post/`): tên, hình thức, khu vực, lương, lưới ca kéo-tô, kỹ năng, bán kính, ảnh; số ứng viên phù hợp (điểm ≥60, dữ liệu mẫu) đổi trực tiếp. Bấm Đăng: gửi tin vào hàng chờ duyệt (`submitJob`, kho quản trị), đóng dấu ĐÃ ĐĂNG rồi sang `/match` mang theo `state.draftPosition`. Là trang đăng tin duy nhất: mọi nút "Đăng tin" trỏ về đây, `/tuyen-dung/dang-tin` chuyển hướng sang (2026-10-29, form 4 bước cũ đã xóa). |
| `/ho-so` | **[có]** Chỉ NLĐ (ProtectedRoute). `pages/public/ProfilePage.tsx`, `profile/`: bento vừa một màn hình (desktop lưới 12×6, không cuộn trang; mobile xếp dọc). Nền than chì (header/footer tối theo), mỗi khối là thẻ sáng `theme-ivory`: mở đầu, kỹ năng, công khai (mức hoàn thiện + công tắc + nút mở khung "Bản doanh nghiệp nhìn thấy", lật 3D, `PreviewDock`), kinh nghiệm, lịch rảnh, mong muốn, giới thiệu thêm. Hiệu ứng: vào trang các khối bật lên lần lượt; rê chuột khối nổi + nghiêng nhẹ; bấm Sửa thì khối phóng ra phủ cả lưới (FLIP trong `ChapterShell`, khối khác lùi, Esc/Xong thu về). Sửa là lưu ngay vào `context/profileStore.ts` (persist `workmate-profile`; ảnh đại diện chỉ giữ trong phiên). Đổi kỹ năng/lịch rảnh/lương/khoảng cách/loại việc → điểm phù hợp ở mọi trang đổi theo. |
| `/ca-nhan` | **[có]** Trang Cá nhân kiểu "không gian hồ sơ" (`components/archive/*` + `pages/public/personal/*`): mặt bàn than chì (header/footer tối theo), ảnh in giấy sáng đặt so le; desktop có chuột kéo thả được (+ "Xếp lại mặt bàn"); ảnh dạng con tem (viền răng cưa `.stamp-edge`), mặt bàn có vệt kẻ chéo (`.desk-lines`); bấm mở → chính tấm ảnh phóng ra giữa màn hình (ảnh phủ lúc bay, giữ đúng tỉ lệ) rồi lộ nội dung, các tấm khác lùi về sau, nền không đổi màu; đóng thì thu về đúng chỗ (theo video `references/p2.mp4`; Esc/X/bấm ra ngoài để đóng). Khách: 4 ảnh giới thiệu cách xây hồ sơ; người tìm việc: 6 phần từ `profileStore` (cùng nguồn dashboard và điểm phù hợp, mục chưa có dữ liệu → trạng thái trống, sửa ở `/tim-viec/ho-so`); NTD: 6 phần, công ty mẫu `personal/companyData.ts`. `?xem=doanh-nghiep|ung-vien` = bản công khai chỉ xem (thẻ ở trang Việc làm trỏ tới). Header: khách bấm "Trang cá nhân" → đăng nhập rồi quay lại. `/trang-ca-nhan` (bản bento cũ, đã xóa code) chuyển hướng về đây. |
| `/match` | **[có]** (2026-10-28) Trang MATCH công khai, nút MATCH ở header trỏ tới đây (menu dashboard vẫn giữ `/tim-viec/match`, `/tuyen-dung/match` — trang trống). Khách: 3 thẻ mẫu làm mờ + mời đăng ký theo vai trò. Người tìm việc: cột tiêu chí lấy từ hồ sơ (lương, khoảng cách, loại việc chỉnh tại chỗ; xếp hạng ưu tiên kéo thả/↑↓) + danh sách vị trí có ✓/✗, tabs Phù hợp/Đã lưu/Đã ứng tuyển/Đã kết nối (gồm 13 việc mẫu + tin j1–j4 của doanh nghiệp demo). NTD: chọn vị trí (j1–j4) → ứng viên (kèm người tìm việc demo), tabs Phù hợp/Đã lưu/Đã quan tâm/Đã kết nối, Bỏ qua/Hiện lại. Ứng tuyển / quan tâm / kết nối đọc-ghi qua kho demo dùng chung (xem mục dưới); cuối trang có nút "Đặt lại dữ liệu demo". Điểm tính ở `pages/public/match/score.ts` (5 tiêu chí, trọng số theo hạng 35/25/16/14/10); dữ liệu mẫu `match/data.ts`; trạng thái lưu/bỏ qua ở `context/matchStore.ts` (persist `workmate-match`). (2026-10-29) Người tìm việc + NTD có 2 chế độ xem (nhớ lựa chọn, mặc định Bộ sưu tập): **Danh sách** (như trên, yên tĩnh) và **Bộ sưu tập** theo `references/p4.mp4` — lưới 2 cột ảnh lớn, ảnh vẽ lại bằng WebGL tự viết (`match/gallery/CurvedGallery.tsx` + `curveGL.ts`, không thư viện 3D) để cuộn ngược ra sau ở mép trên/cong nhẹ mép dưới, gợn + tách màu khi cuộn nhanh, giảm màu ấm, rê chuột rõ màu; Lenis chỉ bật ở chế độ này (`useSmoothScroll(enabled)`); lọc theo mức phù hợp; bấm thẻ → `MatchDetail` (ảnh phóng ra như trang Cá nhân); vòm màu đá hai bên (`MatchArches`, cắt tại footer). Ảnh theo từng vị trí; ảnh ứng viên không lộ mặt. Màn <lg / giảm chuyển động / chất lượng thấp → lưới ảnh tĩnh. |
| `/tin-nhan` | **[có]** (2026-10-29) Nhắn tin giữa hai bên đã kết nối (`pages/public/MessagesPage.tsx` + `messages/*`): danh sách hội thoại + khung chat, tin chưa đọc, trả lời nhanh, phía kia tự "đang gõ" rồi trả lời (giả lập trong kho demo). Liên kết sâu `?c=<jobId>|<seekerId>`. Số chưa đọc hiện ở menu tài khoản. Chưa có backend. |
| `/thong-bao` | **[có]** (2026-10-29) Thông báo của tài khoản demo (`pages/public/NotificationsPage.tsx`): nhóm Hôm nay / Trước đó, chấm chưa đọc, "Đánh dấu đã đọc tất cả", bấm → đánh dấu đã đọc + chuyển tới Kết nối / Tin nhắn / Lịch phỏng vấn. Số chưa đọc ở menu tài khoản; chuông ở dashboard trỏ tới đây. |
| `/lich-phong-van` | **[có]** (2026-10-29) Lịch phỏng vấn chung hai phía (`pages/public/SchedulePage.tsx` + `components/interview/*`): dải 7 ngày, tabs Sắp tới / Chờ xác nhận / Đã qua-đã hủy. Doanh nghiệp mời (1–3 khung giờ, hình thức, địa điểm) từ trang Kết nối hoặc khung chat, hủy lịch tại đây; người tìm việc chọn giờ hoặc từ chối. Dữ liệu trong kho demo (ứng viên mẫu tự xác nhận sau vài giây). `/tim-viec/lich-phong-van`, `/tuyen-dung/lich-phong-van` chuyển hướng về đây. |
| `/viec-lam/:id` Chi tiết | **[có]** (2026-10-29) Làm lại theo khung chi tiết chung (`DetailHero` + `DetailLayout`, như `/cong-ty/:id`), đọc tin theo `id` từ `jobs/catalog.ts` (tin đã ẩn vẫn mở qua `findAnyJob`, có dòng "đã ngừng hiển thị", không ứng tuyển được). Người tìm việc: điểm + thanh 5 tiêu chí (trọng số theo Cấu hình hệ thống) + kỹ năng thiếu; nút Ứng tuyển → Chờ phản hồi/Rút → Đồng ý kết nối → Nhắn tin (kho demo), Lưu. Khách: "Đăng nhập để ứng tuyển" (quay lại đúng tin). NTD/admin chỉ xem. Báo cáo chỉ hiện khi đã đăng nhập. |
| `/dang-nhap`, `/dang-ky` | **[có]** UI theo DESIGN.md. **Đăng nhập demo** (chưa có backend): `admin1` → ứng viên, `admin2` → NTD, `admin3` → admin, mật khẩu `123456`, có nút đăng nhập nhanh. Danh sách ở `src/constants/demoAccounts.ts` — thay bằng `authService` khi có backend. Đăng nhập/đăng ký xong về trang chủ (hoặc trang đang xem dở nếu bị chặn); khu làm việc chỉ là nơi tổng hợp. Đăng ký: không lưu gì, vào admin1/admin2 theo vai trò. |
| `/cong-ty` (danh sách), `/cam-nang`, `/cam-nang/:slug` | **[có]** Lưới công ty từ dữ liệu mẫu; danh sách + bài cẩm nang mẫu (`pages/public/content/articles.ts`). |
| `/gioi-thieu` · `/nha-tuyen-dung` · `/ho-tro` · `/lien-he` · `/dieu-khoan` · `/bao-mat` | **[có]** khung, nội dung mẫu (`pages/public/content/*`, khung chung `ContentPage`). Điều khoản/bảo mật là bản nháp cần duyệt; form liên hệ chưa gửi đi. |

### Ứng viên `/tim-viec`
| Route | Trạng thái |
|---|---|
| `/tim-viec` Dashboard · `/phu-hop` Việc phù hợp (lọc, sắp xếp, phân rã 5 tiêu chí từ `catalog.ts`) · `/ho-so` Hồ sơ (lịch rảnh T2–CN × buổi, kỹ năng) | **[có]** UI theo DESIGN.md, việc và điểm lấy từ `pages/public/jobs/catalog.ts`, hồ sơ ở `context/profileStore.ts` (`workmate-profile`, form `/tim-viec/ho-so` lưu tường minh bằng nút "Lưu hồ sơ"; `/ho-so` lưu ngay), đơn ứng tuyển ở `pages/jobseeker/mockData.ts`, state cục bộ |
| `/da-luu` Việc đã lưu · `/ung-tuyen` Đã ứng tuyển · `/match` Kết nối | **[có]** (2026-10-29) Đọc kho chung (`connectionService`, `matchStore`): Việc đã lưu (điểm, trạng thái, Ứng tuyển/Đồng ý kết nối/Bỏ lưu), Đã ứng tuyển (tabs + nhóm "Doanh nghiệp đang chờ bạn", Rút/Nhắn tin/Chọn giờ), Kết nối (tin nhắn cuối, chưa đọc, phỏng vấn). Tổng quan dùng số liệu thật từ kho. Dữ liệu demo, chưa có backend. |
| `/tin-nhan` (chuyển hướng sang `/tin-nhan` công khai) · `/lich-phong-van` (chuyển hướng sang `/lich-phong-van` công khai) | **[có]** hai route chuyển hướng |
| `/cv` Quản lý CV | **[có]** (2026-10-29) Tải lên kéo-thả/chọn file (PDF, ảnh ≤5MB, tối đa 5), xem trước, đổi tên, đặt mặc định, tải xuống, xóa. Danh sách ở `context/cvStore.ts` (localStorage `workmate-cv`), nội dung file ở IndexedDB (`utils/fileStore.ts`) — chỉ trên trình duyệt này. |
| `/cai-dat` Cài đặt | **[có]** (2026-10-29) Dùng chung hai phía (`components/settings/SettingsPage.tsx`): tài khoản + đổi mật khẩu (mẫu), công tắc thông báo (lọc thật ở `/thong-bao`), email tóm tắt, quyền riêng tư, đặt lại dữ liệu demo, xóa tài khoản (gõ XÓA). Lưu ở `context/settingsStore.ts` (`workmate-settings`). |

### Nhà tuyển dụng `/tuyen-dung`
| Route | Trạng thái |
|---|---|
| `/tuyen-dung` Dashboard · `/tin-dang` Tin tuyển dụng | **[có]** (2026-10-30) Đọc kho chung qua `adminService` (`useCompanyJobs`, `useJobNumbers`, `fitCandidatesOf` — điểm ≥60 như /match) + `connectionService`. Tin tuyển dụng: một danh sách (j1–j4 + tin đăng ở /dang-tin), tabs Đang mở/Tạm dừng/Đã đóng/Chờ duyệt/Cần xử lý; Tạm dừng/Mở lại/Đóng tin ghi `adminStore.jobStatus` → tin không mở thì ẩn khỏi trang công khai và phía người tìm việc (admin thấy nhãn "NTD tạm dừng/đã đóng"). Tổng quan: số thật (tin mở, ứng viên phù hợp, kết nối + số người đã đi làm, phỏng vấn 7 ngày tới), ứng viên vừa quan tâm, lịch sắp tới. Chưa có: sửa tin, lượt xem, chọn sẵn vị trí khi sang /match; /match phía NTD vẫn liệt kê cả tin tạm dừng. |
| `/dang-tin` | **[có]** chuyển hướng sang `/dang-tin` công khai (bản form 4 bước cũ đã xóa 2026-10-29) |
| `/tim-ung-vien` Tìm ứng viên · `/ung-vien-da-luu` Ứng viên đã lưu · `/match` Kết nối | **[có]** (2026-10-29) Đọc kho chung: Tìm ứng viên (lọc tên/kỹ năng/quận/buổi rảnh/lương, điểm hợp nhất, Quan tâm chọn tin, Lưu), Ứng viên đã lưu (nhóm theo tin), Kết nối (Nhắn tin, Mời phỏng vấn). `/tuyen-dung/ung-vien-phu-hop` chuyển hướng sang `/match` (file `SuggestedCandidates.tsx` còn nhưng không còn route). |
| `/tin-nhan` · `/lich-phong-van` (chuyển hướng sang trang công khai) | **[có]** chuyển hướng |
| `/ho-so-cong-ty` Hồ sơ công ty | **[có]** (2026-10-29) Form (thông tin chung, ảnh bìa chọn sẵn, môi trường/giá trị/chính sách, văn hóa, liên hệ) + xem trước thẻ; Lưu/Hủy/Khôi phục mặc định. Lưu ở `context/companyStore.ts` (`workmate-company`); `/cong-ty/song-han` và trang Kết nối đọc từ đó. |
| `/cai-dat` Cài đặt | **[có]** như phía người tìm việc (`SettingsPage`); công tắc "Công khai trang công ty". |

### Quản trị `/admin`
| Route | Trạng thái |
|---|---|
| `/admin` Dashboard · `/nguoi-dung` Người dùng (lọc, khóa/mở khóa) · `/xac-minh` Xác minh doanh nghiệp (duyệt/từ chối có lý do) | **[có]** (2026-10-29) Tổng quan dùng số thật (tin chờ duyệt, báo cáo mở, kết nối 7 ngày, NTD chưa xác minh; số người dùng/đăng ký mới vẫn mẫu). Xác minh gọi `setCompanyVerified` và Người dùng gọi `setSeekerLocked`/`setCompanyLocked` khi tên khớp một công ty/ứng viên (không khớp thì giữ dữ liệu mẫu `pages/admin/mockData.ts`, state cục bộ) |
| `/kiem-duyet` Kiểm duyệt (tab Chờ duyệt / Bị gắn cờ / Đã xử lý; duyệt, từ chối/ẩn có lý do, khôi phục) · `/tin-tuyen-dung` Tin tuyển dụng (bảng mọi tin, tìm/lọc/sắp xếp, khung chi tiết trượt phải) · `/nha-tuyen-dung` Nhà tuyển dụng (xác minh, khóa/mở khóa công ty) · `/ung-vien` Ứng viên (khóa/mở khóa) | **[có]** (2026-10-29) đọc/ghi `adminStore` nên có tác dụng thật lên web. Khung chi tiết dùng chung `components/admin/DetailDrawer`; hộp xác nhận/nhập lý do và cụm nút kiểm duyệt ở `components/admin/parts` |
| `/bao-cao` Báo cáo vi phạm (tab Đang mở / Đã xử lý; Bỏ qua, Ẩn tin, Khóa công ty/ứng viên) · `/thong-ke` Thống kê (phễu kết nối, người dùng mới 14 ngày [mẫu], tin theo quận/loại việc, thời gian phản hồi, tin gắn cờ) · `/cau-hinh` Cấu hình hệ thống (trọng số 5 tiêu chí tổng 100, từ cấm, ngưỡng lương, bán kính, mở đăng ký, khôi phục/đặt lại) | **[có]** (2026-10-29) file `pages/admin/{Reports,Stats,Config}.tsx`. Đóng đăng ký → `/dang-ky` hiện thông báo tạm dừng. Bán kính mặc định đã lưu nhưng form đăng tin chưa đọc |
| Nút "Báo cáo" phía người dùng | **[có]** `components/report/ReportButton` (lý do + ghi chú → `fileReport`), đặt cuối khung chi tiết việc làm (Kết nối người tìm việc), khung chi tiết ứng viên (Kết nối doanh nghiệp) và `/vi-tri/:id` |

### Tính năng sẽ có (suy ra từ types/service/nội dung trang chủ, chưa có UI)
- **Matching**: `MatchResult` gồm điểm 0–100, mức (`high ≥80`, `medium ≥60`, `possible ≥40`,
  `low`), phân rã 7 tiêu chí với trọng số `MATCH_WEIGHTS`:
  kỹ năng 25% · lịch 20% · vị trí 20% · lương 15% · kinh nghiệm 10% · loại việc 5% · nguyện vọng 5%.
  Bày tỏ / rút quan tâm: `matchService.expressInterest/withdrawInterest`. `matched = true` khi hai bên cùng quan tâm.
- **Tiêu chí tin tuyển dụng** chia 3 lớp: `mandatoryCriteria` (bắt buộc), `preferredCriteria` (ưu tiên), `softCriteria` (mềm).
- **Lịch rảnh / lịch làm**: `WeeklyAvailability` = khung giờ theo từng ngày T2–CN; ứng viên có `maxDistanceKm`.
- **Tìm việc gần tôi**: filter `nearMe`, `lat/lng`, `radiusKm`; có biến `VITE_GOOGLE_MAPS_KEY`.
- **Ứng tuyển**: trạng thái `applied → viewed → considering → interview_invited → hired | rejected`.
- **Chat sau MATCH**: `ChatRoom` gắn với `matchId`; đã cài `socket.io-client`, biến `VITE_SOCKET_URL`.
- **Phỏng vấn**: online (có `meetLink`) / offline; trạng thái `pending/confirmed/done/cancelled`.
- **Đánh giá hai chiều** (`Review`, `fromRole` ứng viên ↔ NTD) và **thông báo** (`Notification`).
- **Xác minh doanh nghiệp**: `RecruiterProfile.verified`.
- **[chưa rõ]** “Phân tích CV bằng AI”, “Gợi ý kỹ năng còn thiếu”, “Hồ sơ năng lực trực tuyến” — từng được quảng bá trên trang chủ, chưa có type/service nào. Cần hỏi chủ dự án trước khi làm.

## 4. Kỹ thuật

- **Stack**: React 18 + TypeScript + Vite 5, Tailwind 3, React Router 6 (`BrowserRouter`),
  Zustand (auth, có persist), react-query 3 (đã cài, chưa dùng), react-hook-form + zod
  (đã cài, chưa dùng nhiều), axios, socket.io-client, date-fns, lucide-react, react-hot-toast.
- **Hiệu ứng (chỉ trang chủ)**: GSAP 3.15 + ScrollTrigger (`src/utils/gsap.ts` — luôn import
  từ đây), `@gsap/react` (`useGSAP`), Lenis (smooth scroll, chạy trên ticker GSAP),
  `motion` (Framer Motion v11+), WebGL thuần cho nền intro (không dùng Three.js).
- **Backend**: **không nằm trong repo này**. API mặc định `http://localhost:8000/api`
  (`VITE_API_URL`), JWT Bearer, 401 → logout + về `/dang-nhap`.
  **[chưa rõ]** Ngôn ngữ/stack backend, hợp đồng API thực tế — các endpoint trong
  `src/services/*` là phía frontend tự định nghĩa.
- **Alias import**: `@/`, `@components`, `@pages`, `@hooks`, `@context`, `@services`, `@utils`,
  `@styles`, `@constants`, `@assets` (khai báo ở cả `tsconfig.json` và `vite.config.ts`).
  Kiểu dữ liệu import từ `@/types` — alias `@types` cũ đã bỏ vì trùng tên dành riêng của TypeScript.
- **Công cụ AI**: `CLAUDE.md` (quy tắc làm việc), `.claude/skills/` (workmate-ui, frontend-design,
  ui-ux-pro-max, web-design-guidelines, vercel-react-best-practices), `.claude/agents/`
  (frontend-builder, visual-qa, code-reviewer — đều chạy Sonnet).
- **Ngôn ngữ**: toàn bộ UI và comment trong code bằng **tiếng Việt**. Route path tiếng Việt không dấu.

## 5. Trang chủ — kiến trúc trải nghiệm cuộn

Lấy cảm hứng từ cách dẫn dắt cuộn của uncommondesign.group (**không** sao chép thương hiệu/bố cục).

Hành trình 6 section (`src/pages/public/HomePage.tsx`):

| | Component | Nền | Nội dung |
|---|---|---|---|
| A | `IntroHero` | than chì → ngà | Mở trang: chỉ logo giữa màn hình. Cuộn: logo thu nhỏ bay về header, nav hiện dần, rồi tiêu đề + thanh tìm kiếm + tag |
| B | `FitSection` | ngà | 3 lợi ích |
| C | `OpportunitiesSection` | đá (stone) | Thẻ việc làm **mẫu** dạng bento, ghi rõ “Tin mẫu” |
| D | `HowItWorksSection` | xám đậm | Quy trình 3 bước |
| E | `StatementSection` | sage | Tuyên ngôn, tấm nền nở ra bằng clip-path |
| F | `ClosingSection` | than chì | CTA “Tìm việc ngay” cuộn về ô tìm kiếm |

Cơ chế quan trọng (đọc comment trong từng file trước khi sửa):
- **Logo là một phần tử duy nhất** — chính logo trong header (`PublicLayout`), được
  `IntroHero` điều khiển qua data-attribute: `data-brand-logo`, `data-header-item`,
  `data-header-bg`. Header/hero mặc định ở trạng thái cuối; JS chỉ thêm intro → tắt JS
  hoặc bật “giảm chuyển động” vẫn dùng được.
- **Màu theo section**: mỗi section có `data-theme`; `useSectionThemes` nội suy biến CSS
  `--page-bg` theo cuộn, còn `--page-fg` đổi ở mốc 50% bằng CSS transition (`@property`)
  để chữ không bao giờ trùng màu nền. Dùng token Tailwind `page-bg/fg/muted/line/surface/edge`.
- **Nội dung placeholder** nằm tập trung ở `src/components/home/content.ts`.
- Chỉ trang chủ mới có header cố định đổi màu, con trỏ tùy biến (`CustomCursor`), nút
  nam châm (`Magnetic`), chữ cuộn (`RollText`), hạt nhiễu (`.grain`).
- `RouteScroll` (`components/common`) xử lý vị trí cuộn khi chuyển trang / Back-Forward
  cho mọi layout; `PublicLayout` dùng `FrozenOutlet` để trang cũ giữ nguyên khi fade-out.

Component trang chủ cũ (`PinnedStatements`, `HorizontalJobs`, `Recognition`, `ContactSection`,
`motion/Preloader`, `motion/Counter`) đã xóa ngày 2026-10-23 theo đồng ý của chủ dự án — lấy lại từ git nếu cần.

## 6. Định hướng thiết kế & sản phẩm

Chi tiết đầy đủ ở **`DESIGN.md`** (nguồn chuẩn cho design system). Màu nằm duy nhất ở
`src/styles/tokens.json`; Tailwind, biến CSS `--wm-*` và `THEMES` đều đọc từ đó.

**Bảng màu (trang chủ)** — trung tính ấm, đơn sắc, **không** dùng màu nhấn bão hòa
(đã bỏ hẳn cam/đỏ/terracotta theo yêu cầu chủ dự án):

| Token `wm-*` | Hex | Dùng cho |
|---|---|---|
| charcoal | `#242522` | Nền intro/kết, chữ trên nền sáng, nút chính |
| graphite | `#454640` | Nền tối giữa trang |
| sage | `#A6A69A` | Nền tuyên ngôn |
| stone | `#D9D3C8` | Nền khu cơ hội việc làm |
| mist | `#E1DED5` | Bề mặt phụ |
| ivory | `#F3F0E9` | Nền sáng chính, chữ trên nền tối |

Nguyên tắc: nút tối chữ ngà (đảo lại trên nền tối); tránh trắng/đen tuyệt đối, gradient
màu mè, bóng đổ nặng, glassmorphism. Tương phản chữ ≥ 4.5:1, viền ô nhập ≥ 3:1.
Typography: Instrument Sans (display) + Inter; chữ lớn, nhiều khoảng trắng, xuống dòng có chủ đích.

**Phạm vi hiệu ứng**: chuyển động nặng **chỉ ở trang công khai** (chủ yếu trang chủ).
Dashboard ứng viên / NTD / admin là nơi làm việc → phải nhanh, yên tĩnh, không animation trang trí.
Mọi hiệu ứng phải có phương án cho mobile và `prefers-reduced-motion`. Không dùng âm thanh
(đã thử và bị loại: “không cần thiết trong trang web”).

**[chưa rõ] / việc tiếp theo hợp lý** (chưa được giao, hỏi trước khi làm):
- Nối API thật: đăng nhập/đăng ký, danh sách & chi tiết việc, đăng tin.
- Dựng các trang **[khung]**, ưu tiên luồng lõi: hồ sơ + lịch rảnh → việc phù hợp → match → chat.
- Thay toàn bộ nội dung placeholder ở `content.ts` bằng nội dung thật.

## 7. Lưu ý khi làm việc với repo

- Có git (nhánh `main`). Commit checkpoint trước thay đổi lớn; không force push.
- Kiểm tra: `npx tsc --noEmit -p .` (0 lỗi), `npm run lint` (ESLint 9, `eslint.config.mjs`),
  `npm run build`. Chưa có test tự động.
- Sửa `tailwind.config.js` thì **khởi động lại dev server** — Vite không tự nhận config mới.
- Dev server: `npx vite --port 5173`. Console còn 2 cảnh báo React Router v7 có sẵn (vô hại).
- Thử trang chủ bằng trình duyệt: Lenis giữ đích cuộn riêng nên `window.scrollTo` có thể
  bị kéo ngược. Dùng `(await import('/src/hooks/useSmoothScroll.ts')).scrollToY(y)`.
  ScrollTrigger tự đo lại khi đổi kích thước cửa sổ — đo vị trí section ngay trước khi cuộn.
- Đăng nhập đang là giả: muốn vào dashboard khi test, đặt tạm localStorage
  `workmate-auth` = `{"state":{"user":{"id":"t","role":"jobseeker","email":"t@example.test"},"token":"t"},"version":0}`
  rồi **xóa lại** sau khi thử.

## 7. Liên kết trang chủ ↔ dashboard (kế hoạch 3 tầng, 2026-10-23)

- **Tầng 1 — điều hướng theo vai trò [có]:** `constants/roles.ts` (`ROLE_AREAS`, `canVisit`). Header công khai hiện tên khu ("Khu tìm việc"…) và nút Đăng xuất. `ProtectedRoute` nhớ trang cũ (`state.from`) để đăng nhập xong quay lại. Vào nhầm khu thì hiện trang giải thích. Nút thứ hai ở `ClosingSection` đổi theo vai trò. Nav header theo vai trò (`NAV` trong `PublicLayout`, đã bỏ "Loại việc", "Công ty", "Cẩm nang" khỏi header). Lời mở đầu trang chủ theo vai trò: `heroCopy` trong `components/home/content.ts` (khách trung lập; NTD/admin không có ô tìm việc).
- **Tầng 3 — kho dữ liệu demo dùng chung [chưa làm, ưu tiên tiếp theo]:** gộp mock của trang công khai và 3 khu vào một store Zustand persist (jobs, companies, candidates, applications, interests/matches, verification). Mọi trang đọc/ghi chung để diễn trọn vòng admin2 đăng tin → admin1 ứng tuyển/quan tâm → MATCH hai phía → admin3 duyệt/khóa. Sau này thay ruột store bằng `src/services`.

### Kho dữ liệu demo dùng chung (2026-10-29, mới làm cho `/match`)
- `context/demoStore.ts` (Zustand persist `workmate-demo`): `interests` (quan tâm theo phía seeker/recruiter), `connections`, `notifications`; `ME = 'me'` là người tìm việc demo (admin1), `RECRUITER_JOBS` j1–j4 là tin của doanh nghiệp demo (admin2).
- Giao diện chỉ gọi `services/connectionService.ts` (`usePairStatuses`, `expressInterest`, `withdrawInterest`, `useOnNewConnection`, `resetDemoData`); khi có backend chỉ đổi ruột file này.
- Kết nối hai chiều: hai bên cùng quan tâm → tự tạo kết nối + thông báo. Một số vị trí/ứng viên mẫu tự đáp lại sau ~3,5 giây (giả lập).
- Hồ sơ người tìm việc demo: `context/profileStore.ts` (persist `workmate-profile`), nguồn duy nhất cho `/ho-so`, `/tim-viec/ho-so`, `/ca-nhan`, `ME_CANDIDATE` và mọi điểm phù hợp (`getSeekerCriteria()` / `useSeekerCriteria()`). Khách vẫn dùng hồ sơ mẫu cố định `SEEKER_DEFAULT`. Nút "Đặt lại dữ liệu demo" trong Cài đặt đặt lại cả hồ sơ.
- **Nhận việc → xác nhận đi làm** (2026-10-30): kho demo có `hires` (persist v4): doanh nghiệp "Nhận vào làm" (ngày bắt đầu + lời nhắn) hoặc "Không nhận" trên cặp đã kết nối (Kết nối, Lịch phỏng vấn mục đã xác nhận); `offered` → ứng viên "Xác nhận đi làm" / "Từ chối" (nhóm "Lời mời nhận việc" ở Đã ứng tuyển, Kết nối) hoặc doanh nghiệp "Rút lời mời". Chỉ khi ứng viên xác nhận (`accepted`) mới tính "đã đi làm"; trạng thái cuối không đổi lại. Mỗi bước có thông báo (`offer`, `offer_accepted`, `offer_declined`, `offer_withdrawn`, `rejected`) + tin hệ thống trong chat; ứng viên mẫu tự xác nhận sau ~3,5 giây. UI ở `components/hire/`, hàm ở `connectionService` (`useHire`, `useHires`, `offerJob`…). Thống kê admin: phễu có "Được nhận" và "Đã đi làm".
- Thông báo lưu trong kho demo (`useNotifications`, `useUnreadCount`), hiển thị ở `/thong-bao`.
- Dashboard (`/tim-viec/*`, `/tuyen-dung/*`, admin) CHƯA chuyển sang kho chung; hiện chỉ `/match` dùng.
- **Tầng 2 — nối luồng nghiệp vụ [chưa làm, sau tầng 3]:** "Ứng tuyển"/"Lưu" ở `/viec-lam/:id` theo vai trò, tìm kiếm trang chủ kèm điểm phù hợp khi là ứng viên, nhãn "Đã xác minh" trên thẻ việc công khai.

### Kho quản trị (2026-10-29)
- `context/adminStore.ts` (Zustand persist `workmate-admin`) + `services/adminService.ts` (giao diện chỉ gọi service): `moderation` (pending/approved/rejected/hidden + lý do), `posted` (tin mới đăng từ `/dang-tin`), `lockedCompanies`, `verifiedCompanies`, `lockedSeekers`, `reports`, `config` (trọng số 5 tiêu chí, từ cấm, lương tối thiểu, bán kính mặc định, mở đăng ký), `resetAdminData()`.
- Tự gắn cờ (`flagsOf`): lương dưới mức tối thiểu, thiếu kỹ năng/ca/mô tả, chứa từ cấm. Tin có sẵn mặc định "đang hiện"; tin mới đăng mặc định "chờ duyệt".
- Tác dụng lên web: `getVisibleJobs()/useVisibleJobs()` (qua `getAllJobs()/useAllJobs()` ở `jobs/catalog.ts`) chỉ gồm tin đã duyệt và công ty không bị khóa → `/viec-lam`, `/cong-ty`, Kết nối, dashboard người tìm việc đều theo. Tra tên vị trí cũ (kết nối, tin nhắn) dùng `findAnyJob` ở `jobs/lookup.ts` để tin đã ẩn vẫn có tên. Ứng viên bị khóa bị bỏ khỏi `candidatesOf`, Tìm ứng viên, Kết nối phía doanh nghiệp. `match/score.ts` không truyền ưu tiên → dùng trọng số trong `config`.
- `/dang-tin` gửi tin vào hàng chờ duyệt (`submitJob`); `/tuyen-dung/tin-tuyen-dung` có khối "Tin vừa đăng" kèm trạng thái kiểm duyệt.
- Báo cáo, Cấu hình, Thống kê đã có UI (xem bảng Quản trị).

## 8. Thêm tính năng mới — làm ở đâu (cập nhật 2026-10-23)

| Muốn làm | Sửa ở đây |
|---|---|
| Trang mới | `src/pages/<khu>/Ten.tsx` + `<Route>` trong `src/App.tsx` (đặt trong `ProtectedRoute role=…` nếu cần đăng nhập) |
| Mục menu khu làm việc | `navItems` trong `components/layout/{Jobseeker,Recruiter,Admin}Layout.tsx` (khung chung: `DashboardShell`) |
| Mục header trang công khai | `NAV` trong `components/layout/PublicLayout.tsx` (theo vai trò; khách = trung lập) |
| Lời trang chủ theo vai trò | `heroCopy` (đầu trang) và `homeCopy` (các phần giữa, đọc qua `useHomeCopy`) trong `components/home/content.ts`; nút cuối trang: `SECOND_CTA` trong `ClosingSection.tsx` |
| Khu/nhãn của vai trò, kiểm tra quyền vào trang | `constants/roles.ts` (`ROLE_AREAS`, `canVisit`) |
| Tài khoản demo | `constants/demoAccounts.ts` — xóa khi có backend, thay bằng `services/authService` |
| UI dashboard dùng lại | `components/dashboard/*` (PageHeader, Panel, StatCard, StatusBadge, MatchScore, EmptyState, MockNotice) — dùng trước khi viết mới |
| Dữ liệu mẫu | hiện tách theo khu `pages/<khu>/mockData.ts` → sẽ gộp vào kho chung (mục 7, Tầng 3) |
| Gọi API thật | `src/services/*` (đã có khung `api.ts` + axios, chưa trang nào gọi) |
| Màu | chỉ `src/styles/tokens.json`; theme vùng: `.theme-ivory` / `.theme-charcoal` trong `index.css` |

Còn giữ có chủ đích (chưa dùng nhưng cần cho sau): `services/*`, `utils/matchScore.ts` (nhãn mức phù hợp — nên dùng chung với `MatchScore`), `utils/format.ts` (định dạng lương/ngày).

**Đã dọn (2026-10-29):** class cũ `.btn-*`, `.card`, `.input`, `.badge-*` và màu `primary/secondary/match/ink` đã gỡ; mọi trang theo DESIGN.md.

## 9. Việc dọn dẹp để sau (chủ dự án hoãn, 2026-10-25)
- Gỡ 7 thư viện đã cài nhưng chưa dùng: `react-hook-form`, `@hookform/resolvers`, `zod`, `react-query`, `socket.io-client`, `date-fns`, `split-type` (vài cái có thể cần khi nối backend — hỏi trước khi gỡ).
- Thêm `references/*.mp4` vào `.gitignore` (video tham khảo, đang để ngoài git).
