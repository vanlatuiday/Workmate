# Workmate — Bối cảnh dự án

> Tài liệu cho phiên Claude / người mới vào dự án. Đọc file này trước khi sửa code.
> Cập nhật lần cuối: 2026-10-23 (dashboard 3 vai trò, liên kết theo vai trò, dọn component cũ). Khi trạng thái tính năng thay đổi, sửa lại mục 3, 6, 7, 8.
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
| Route | Trạng thái |
|---|---|
| `/` Trang chủ | **[có]** Hoàn chỉnh về trải nghiệm (xem mục 5). Nội dung là placeholder. |
| `/viec-lam` | **[khung]** Đã xóa nội dung cũ (2026-10-23), chỉ còn dòng "đang chuẩn bị". Định hướng: trang giới thiệu cho người tìm việc. Ô tìm kiếm/tag trang chủ vẫn dẫn tới đây nhưng chưa có kết quả. |
| `/viec-lam/:id` Chi tiết | **[có]** UI, hiển thị % phù hợp, nút “Ứng tuyển ngay” — **mock**, chưa đọc `id`, nút chưa làm gì. |
| `/dang-nhap`, `/dang-ky` | **[có]** UI theo DESIGN.md. **Đăng nhập demo** (chưa có backend): `admin1` → ứng viên, `admin2` → NTD, `admin3` → admin, mật khẩu `123456`, có nút đăng nhập nhanh. Danh sách ở `src/constants/demoAccounts.ts` — thay bằng `authService` khi có backend. Đăng ký: không lưu gì, vào admin1/admin2 theo vai trò rồi tới `/tim-viec/ho-so` hoặc `/tuyen-dung/ho-so-cong-ty`. |
| `/cong-ty`, `/cam-nang` | **[khung]** Trang trống (3 dòng). |

### Ứng viên `/tim-viec`
| Route | Trạng thái |
|---|---|
| `/tim-viec` Dashboard · `/phu-hop` Việc phù hợp (lọc, sắp xếp, phân rã 7 tiêu chí) · `/ho-so` Hồ sơ (lịch rảnh T2–CN × buổi, kỹ năng) | **[có]** UI theo DESIGN.md, dữ liệu mẫu `pages/jobseeker/mockData.ts`, state cục bộ |
| `/da-luu` Đã lưu · `/ung-tuyen` Đơn ứng tuyển · `/match` · `/tin-nhan` · `/lich-phong-van` · `/cv` Quản lý CV · `/cai-dat` | **[khung]** Trang trống |

### Nhà tuyển dụng `/tuyen-dung`
| Route | Trạng thái |
|---|---|
| `/tuyen-dung` Dashboard · `/tin-dang` Tin tuyển dụng · `/ung-vien-phu-hop` Ứng viên phù hợp (Quan tâm → MATCH, bỏ qua/hoàn tác) | **[có]** UI theo DESIGN.md, dữ liệu mẫu `pages/recruiter/mockData.ts`, state cục bộ |
| `/dang-tin` Đăng tin | **[có]** Form 4 bước: Thông tin vị trí → Yêu cầu → Lịch & Lương (lịch theo từng ngày) → Tiêu chí. Chưa gửi lên API. |
| `/tim-ung-vien` · `/ung-vien-da-luu` · `/match` · `/tin-nhan` · `/lich-phong-van` · `/ho-so-cong-ty` · `/cai-dat` | **[khung]** Trang trống |

### Quản trị `/admin`
| Route | Trạng thái |
|---|---|
| `/admin` Dashboard · `/nguoi-dung` Người dùng (lọc, khóa/mở khóa) · `/xac-minh` Xác minh doanh nghiệp (duyệt/từ chối có lý do) | **[có]** UI theo DESIGN.md, dữ liệu mẫu `pages/admin/mockData.ts`, state cục bộ |
| `/nha-tuyen-dung` · `/tin-tuyen-dung` · `/ung-vien` · `/bao-cao` · `/kiem-duyet` · `/thong-ke` · `/cau-hinh` | **[khung]** Trang trống |

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
- Áp bảng màu trung tính cho các trang còn lại (dashboard, `/viec-lam`… vẫn dùng xanh `primary`).
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
- **Tầng 2 — nối luồng nghiệp vụ [chưa làm, sau tầng 3]:** "Ứng tuyển"/"Lưu" ở `/viec-lam/:id` theo vai trò, tìm kiếm trang chủ kèm điểm phù hợp khi là ứng viên, nhãn "Đã xác minh" trên thẻ việc công khai.


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

**Nợ còn lại** (chưa dọn vì còn trang dùng): class cũ `.btn-*`, `.card`, `.input`, `.badge-*` trong `index.css` và màu `primary/secondary/match/ink` trong `tailwind.config.js` — chỉ còn `recruiter/PostJob.tsx` và `public/JobDetailPage.tsx` dùng. Làm lại 2 trang này theo DESIGN.md rồi mới xóa (đổi `tailwind.config.js` cần hỏi chủ dự án).
