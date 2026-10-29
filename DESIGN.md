---
version: alpha
name: workmate
description: "Nền tảng việc làm linh hoạt. Trang công khai là một hành trình cuộn biên tập (editorial): bảng màu trung tính ấm đơn sắc, chữ display lớn, nhiều khoảng trắng, chuyển cảnh theo tiến trình cuộn. Không có màu nhấn bão hòa — tương phản đến từ việc xen kẽ nền sáng/tối, kích thước chữ và chuyển động có chủ đích."

# Nguồn sự thật cho màu là src/styles/tokens.json. Bảng dưới phải khớp với file đó.
colors:
  charcoal: "#242522"   # nền tối chính, chữ trên nền sáng, nút chính
  graphite: "#454640"   # nền tối phụ (nhịp tối giữa trang)
  sage: "#A6A69A"       # nền tuyên ngôn / brand story
  stone: "#D9D3C8"      # nền khu việc làm
  mist: "#E1DED5"       # bề mặt phụ (chỉ dùng có chủ đích)
  ivory: "#F3F0E9"      # nền sáng chính, chữ trên nền tối

# Màu theo ngữ cảnh — biến CSS, đổi theo section đang xem (Tailwind: *-page-*)
semantic:
  page-bg: "var(--page-bg)"           # nền section hiện tại
  page-fg: "var(--page-fg)"           # chữ chính
  page-muted: "fg 82% trộn bg"        # chữ phụ, ≥ 4.5:1 trên mọi theme
  page-line: "fg 18% trộn bg"         # đường kẻ trang trí, viền thẻ
  page-surface: "fg 5% trộn bg"       # mặt ô nhập liệu, thẻ
  page-edge: "fg 60% trộn bg"         # viền ô nhập liệu, ≥ 3:1 trên nền sáng

themes:          # tên theme dùng trong data-theme="…"
  charcoal: { bg: charcoal, fg: ivory }
  ivory:    { bg: ivory,    fg: charcoal }
  stone:    { bg: stone,    fg: charcoal }
  sage:     { bg: sage,     fg: charcoal }
  graphite: { bg: graphite, fg: ivory }

typography:
  font-display: "Instrument Sans (500–600)"
  font-body: "Inter (400–500)"
  display-lg: { size: "clamp(2.75rem, 7vw, 5.5rem)", lineHeight: 1.06, letterSpacing: "-0.03em", class: text-display-lg }
  display-md: { size: "clamp(2.5rem, 6vw, 4.5rem)",  lineHeight: 1.08, letterSpacing: "-0.03em", class: text-display-md }
  display-sm: { size: "clamp(2rem, 4.5vw, 3.25rem)", lineHeight: 1.12, letterSpacing: "-0.025em", class: text-display-sm }
  title:      { size: "1.5rem–1.875rem", weight: 500, class: "font-display text-2xl md:text-3xl" }
  body-lg:    { size: "1.125rem", lineHeight: 1.625, class: "text-lg leading-relaxed" }
  body:       { size: "1rem",     lineHeight: 1.625, class: "text-base leading-relaxed" }
  body-sm:    { size: "0.875rem", class: text-sm }
  eyebrow:    { size: "0.75rem", weight: 500, tracking: "0.18em", case: upper, class: eyebrow }

rounded:
  control: 0.5rem   # rounded-control — link/nút nhỏ trong header, menu
  card: 1rem        # rounded-card — thẻ việc làm, thanh tìm kiếm
  cell: 0.375rem    # rounded-md — ô lịch trong hình minh họa
  panel: 2rem       # chỉ trong clip-path chuyển cảnh (StatementSection)
  pill: 9999px      # rounded-full — mọi nút hành động, tag

spacing:
  gutter: "24px / 40px / 64px"           # .shell: px-6 md:px-10 lg:px-16, max-w 1440px
  section: "clamp(5rem, 12vw, 11rem)"    # py-section
  section-sm: "clamp(3.5rem, 8vw, 7rem)" # py-section-sm

motion:
  ease-editorial: "cubic-bezier(0.22, 1, 0.36, 1)"  # ease-editorial
  duration-fast: 300ms     # đổi màu khi hover
  duration-base: 500ms     # dịch chuyển khi hover, chữ cuộn (RollText)
  duration-reveal: 700–800ms  # xuất hiện khi cuộn tới
  fg-swap: 450ms           # đổi màu chữ giữa nền sáng/tối

components:
  button-primary:   { bg: page-fg, text: page-bg, rounded: pill, padding: "16px 32px", type: "text-sm font-medium" }
  button-secondary: { bg: transparent, border: page-line, text: page-fg, rounded: pill, padding: "16px 32px", hoverBorder: page-fg }
  search-bar:       { bg: page-edge (khe 1px), field: page-surface, border: page-edge, rounded: card, submit: button-primary (vuông góc) }
  tag:              { border: page-line, text: page-muted, rounded: pill, padding: "6px 12px", type: text-xs }
  job-card:         { bg: page-surface, border: page-line, hoverBorder: page-fg, rounded: card, padding: "24px–28px" }
  header:           { height: 64px, bg: page-bg (hiện sau intro), border: page-line, fixed on home }
  menu-overlay:     { bg: charcoal, text: ivory/mist, numbers: sage }
  footer:           { bg: page-bg (charcoal), text: page-muted, border: page-line }
---

# Workmate — Design System

> Tài liệu này mô tả hệ thống **đang chạy trong code**. Khi sửa token, sửa ở
> `src/styles/tokens.json` (màu) hoặc `tailwind.config.js` (còn lại), rồi cập nhật file này.
> `references/framer-DESIGN.md` chỉ là tài liệu tham khảo cách trình bày — **không** áp màu
> hay phong cách của nó.

## Overview

Workmate nói về việc làm vừa với nhịp sống, nên giao diện cũng điềm tĩnh: nền trung tính
ấm như giấy, chữ than chì, không màu nhấn rực. Trang chủ được dựng như một chuỗi “màn”
— mỗi section một thông điệp, chữ lớn, nhiều khoảng thở — và các màn nối với nhau bằng
chuyển màu nền theo tiến trình cuộn.

**Đặc điểm nhận diện**
- Đơn sắc ấm: 6 màu, không màu nhấn bão hòa, không gradient màu, không trắng/đen tuyệt đối.
- Tương phản bằng **xen kẽ sáng/tối** giữa các section, không bằng màu nhấn.
- Chữ display Instrument Sans, tracking âm vừa phải; line-height nới rộng để dấu tiếng Việt không bị cắt.
- Chuyển động phản hồi theo cuộn và đảo ngược được; một khoảnh khắc chính là logo bay từ giữa màn hình vào header.
- Mọi nút hành động là viên thuốc (pill).

## Colors

### Bảng màu
| Token | Hex | Vai trò |
|---|---|---|
| `wm-charcoal` | `#242522` | Nền intro/kết, chữ trên nền sáng, nút chính trên nền sáng |
| `wm-graphite` | `#454640` | Nền tối giữa trang |
| `wm-sage` | `#A6A69A` | Nền tuyên ngôn |
| `wm-stone` | `#D9D3C8` | Nền khu việc làm |
| `wm-mist` | `#E1DED5` | Bề mặt phụ, chữ phụ trong menu |
| `wm-ivory` | `#F3F0E9` | Nền sáng chính, chữ trên nền tối |

Có sẵn dưới 3 dạng, cùng một nguồn `tokens.json`: class Tailwind `bg-wm-*`/`text-wm-*`,
biến CSS `--wm-*`, và `THEMES` trong `useSectionThemes.ts`.

### Màu theo ngữ cảnh (khuyến dùng cho component trang chủ)
Component trên trang chủ **không** dùng `wm-*` trực tiếp mà dùng `*-page-*`
(`bg-page-bg`, `text-page-fg`, `text-page-muted`, `border-page-line`, `bg-page-surface`,
`border-page-edge`). Các màu này tự đổi theo section đang xem nên một component đặt ở
nền nào cũng đúng. Ngoại lệ: phần luôn cố định một màu (menu phủ, tấm sage ở tuyên ngôn)
dùng `wm-*` hoặc `THEMES`.

Không dùng modifier độ trong suốt (`/50`) với `page-*` — đó là biến CSS, không có kênh alpha.

### Tương phản (đã đo)
| Theme | Chữ chính | Chữ phụ (82%) |
|---|---|---|
| charcoal | 13.5 : 1 | 9.5 : 1 |
| ivory | 13.5 : 1 | 7.9 : 1 |
| stone | 10.4 : 1 | 6.6 : 1 |
| graphite | 8.4 : 1 | 6.3 : 1 |
| sage | 6.3 : 1 | **4.52 : 1** (sát ngưỡng — không giảm thêm) |

Viền ô nhập liệu (`page-edge`, 60%): 3.65 : 1 trên ivory, 3.28 : 1 trên stone (≥ 3:1 theo WCAG 1.4.11).

### Màu cũ (legacy)
Đã gỡ hẳn (2026-10-29): màu `primary`, `secondary`, `match-*`, `ink-*` khỏi `tailwind.config.js`
và class `.btn-*`, `.card`, `.input`, `.badge-*` khỏi `index.css`. Mọi trang dùng bảng màu trên.

## Typography

- **Instrument Sans** cho display và tiêu đề thẻ; **Inter** cho nội dung. Tải từ Google Fonts trong `index.html`.
- Thang chữ display co giãn theo viewport (`clamp`), nên **không** cần đổi class theo breakpoint.
- Line-height display 1.06–1.12 — nới hơn thông lệ vì dấu chồng tiếng Việt (ấ, ỗ, ặ). Không hạ xuống dưới 1.05.
- Đặt `max-w-[14ch]–[22ch]` cho tiêu đề lớn để xuống dòng có chủ đích.
- Đoạn văn ngắn, `max-w-xl`, `leading-relaxed`; chữ phụ dùng `text-page-muted`.
- Số thứ tự / số liệu dùng `.tnum`.
- Nhãn nhỏ phía trên tiêu đề dùng `.eyebrow` (in hoa, tracking 0.18em) kèm vạch ngắn.

## Layout

- Khối nội dung: `.shell` (max 1440px, lề 24/40/64px).
- Nhịp dọc: `py-section` giữa các section, `py-section-sm` cho khối phụ.
- Lưới 12 cột từ `md` cho bố cục tiêu đề + nội dung; bento cho thẻ việc làm (`lg:grid-cols-12`).
- Khoảng trắng là thành phần thiết kế: mỗi section một thông điệp chính.

### Breakpoints (mặc định Tailwind + `xs`)
| Tên | Rộng | Thay đổi chính ở trang chủ |
|---|---|---|
| `xs` | 475px | — |
| `sm` | 640px | Thanh tìm kiếm chuyển từ dọc sang ngang; logo intro rộng 50% thay vì 62% |
| `md` | 768px | Hiện Đăng nhập/Đăng ký trên header; lưới 12 cột |
| `lg` | 1024px | Hiện nav chính trên header; bento 12 cột |

## Elevation & Depth

Không dùng bóng đổ trên trang công khai. Chiều sâu đến từ:
1. Đổi nền giữa các section (sáng ↔ tối).
2. Bề mặt `page-surface` nhỉnh hơn nền + viền `page-line`.
3. Lớp nhiễu hạt `.grain` rất mờ (7%) phủ toàn trang.
4. Tấm nền nở ra bằng `clip-path` ở chuyển cảnh lớn.

## Shapes

| Vai trò | Class | Giá trị |
|---|---|---|
| Nút hành động, tag | `rounded-full` | viên thuốc |
| Thẻ, thanh tìm kiếm | `rounded-card` | 1rem |
| Link/nút nhỏ trong header, menu | `rounded-control` | 0.5rem |
| Ô nhỏ trong hình minh họa | `rounded-md` | 0.375rem |
| Tấm chuyển cảnh | trong `clip-path` | 2rem → 0 khi phủ kín |

## Components

Component dùng lại được (xem code trước khi viết mới):
- **Chuyển động**: `Reveal` (hiện khi cuộn tới, một lần), `TextReveal` (chữ trồi theo từ, một lần), `MaskedWords` (chữ trong mặt nạ cho GSAP điều khiển theo cuộn, đảo ngược được), `RollText` (chữ cuộn khi hover — cha phải có class `group`), `Magnetic` (nút hút theo chuột), `CustomCursor`.
- **Bố cục**: `PublicLayout` (header + footer), `MenuOverlay`, `RouteScroll`.

**Nút chính** — `bg-page-fg text-page-bg rounded-full px-8 py-4 text-sm font-medium`, chữ bọc `RollText`, có thể bọc `Magnetic`. Trên nền tối tự đảo thành nút ngà.
**Nút phụ** — `border border-page-line text-page-fg rounded-full px-8 py-4`, hover `border-page-fg`.
**Thanh tìm kiếm** — khung `rounded-card` viền `page-edge`, ô `bg-page-surface`, focus có vòng `ring-2 ring-inset ring-page-fg`, nút submit là nút chính.
**Tag** — `border-page-line text-page-muted rounded-full px-3 py-1.5 text-xs`, hover lên `page-fg`.
**Thẻ việc làm** — `bg-page-surface border-page-line rounded-card p-6 md:p-7`, hover viền `page-fg` + mũi tên dịch nhẹ; ghi rõ “Tin mẫu” khi là dữ liệu giả.
**Header (trang chủ)** — cố định, cao 64px, nền `page-bg` + viền `page-line` (chỉ hiện sau intro).
**Focus bàn phím** — trên trang chủ viền 2px `currentColor`, cách 3px; không dùng viền xanh mặc định.

## Motion

Nguyên tắc:
1. **Một khoảnh khắc chính**: logo bay từ giữa màn hình vào header. Các hiệu ứng khác phụ trợ, không tranh.
2. **Theo cuộn và đảo ngược được** cho chuyển cảnh (GSAP ScrollTrigger, `scrub`). Hiệu ứng “xuất hiện một lần” chỉ cho nội dung phụ.
3. **Chỉ transform và opacity**; màu nền đổi qua biến CSS, một listener duy nhất (`useSectionThemes`).
4. Mọi chuyển động có phương án `prefers-reduced-motion` (tắt hẳn hoặc hiện ngay trạng thái cuối) và không phụ thuộc hover cho chức năng chính.
5. Không animation lặp vô hạn không có lý do, không âm thanh.
6. **Phạm vi**: chuyển động nặng chỉ ở trang công khai. Dashboard (ứng viên/NTD/admin) yên tĩnh — chỉ transition màu/hover ngắn.

Chi tiết cơ chế: xem `prj-context.md` mục 5 và comment trong `components/home/*`.

## Do's and Don'ts

**Nên**
- Dùng `*-page-*` cho component trang chủ để tự khớp mọi nền.
- Xen kẽ nền sáng/tối để tạo nhịp; để một số section đổi màu đơn giản làm nhịp nghỉ.
- Kiểm tra tương phản khi thêm theme mới (chữ ≥ 4.5:1, viền ô nhập ≥ 3:1).
- Viết nội dung tiếng Việt, ngắn, có quan điểm; dữ liệu giả phải ghi rõ là mẫu.

**Không nên**
- Thêm màu nhấn bão hòa (cam, đỏ, xanh lá, tím…), gradient màu, glow, glassmorphism, bóng đổ nặng.
- Dùng `#000` / `#fff` tuyệt đối.
- Viết hex trực tiếp trong component — thêm vào `tokens.json` nếu thật sự cần màu mới.
- Đánh số 01/02/03 cho nội dung không phải trình tự thật.
- Đưa hiệu ứng cuộn/con trỏ tùy biến vào dashboard.

## Known gaps & assumptions

- **[giả định]** Thang `title/body/body-sm` ghi theo cách code đang dùng class Tailwind mặc định; chưa có token riêng.
- **[giả định]** Trạng thái lỗi/thành công của form chưa được thiết kế cho bảng màu này (không có đỏ/xanh). Khi cần, ưu tiên biểu tượng + chữ thay vì chỉ màu, và hỏi chủ dự án trước khi thêm màu ngữ nghĩa.
- Màu trong shader nền intro (`HeroCanvas.tsx`) ghi trực tiếp dưới dạng số thực theo charcoal/graphite/ivory — đổi bảng màu thì sửa cả ở đó.
- Skill `frontend-design` liệt kê “nền kem gần #F4F1EA” và “nhãn in hoa phía trên mọi tiêu đề” là dấu hiệu giao diện do AI tạo. Ivory `#F3F0E9` và `.eyebrow` là lựa chọn có chủ đích của chủ dự án — giữ nguyên, nhưng dùng eyebrow tiết chế ở trang mới.
