---
version: alpha
name: workmate
description: "Nền tảng việc làm linh hoạt. Trang công khai là một hành trình cuộn biên tập (editorial): bảng màu trung tính ấm, chữ display lớn, nhiều khoảng trắng, chuyển cảnh theo tiến trình cuộn. Ba màu trạng thái trầm (xanh rêu, hổ phách, gạch) chỉ dùng cho trạng thái và lỗi; tương phản chính vẫn đến từ nền, kích thước chữ và chuyển động có chủ đích."

# Nguồn sự thật cho màu là src/styles/tokens.json. Bảng dưới phải khớp với file đó.
colors:
  charcoal: "#242522"   # nền tối chính, chữ trên nền sáng, nút chính
  graphite: "#454640"   # nền tối phụ (nhịp tối giữa trang)
  sage: "#A6A69A"       # nền tuyên ngôn / brand story
  olive: "#858B70"      # viền khung thẻ (thẻ ảnh dọc ở trang chủ) — chỉ dùng cho viền, không làm nền/chữ
  stone: "#D9D3C8"      # nền khu việc làm
  mist: "#E1DED5"       # bề mặt phụ (chỉ dùng có chủ đích)
  ivory: "#F3F0E9"      # nền sáng chính, chữ trên nền tối
  lavender: "#A99CCB"   # màu nhấn: chỉ cho lớp hạt WebGL trang chủ (ParticleField)
  ice: "#9FB7D6"        # màu nhấn (xanh băng nhạt): chỉ cho lớp hạt trang chủ
  blush: "#D8A9A0"      # màu nhấn (hồng đào nhạt): chỉ cho lớp hạt trang chủ
  violet: "#9B7BE0"     # màu nhấn (tím rõ): chỉ cho lớp hạt trang chủ
  ember: "#E0705A"      # màu nhấn (đỏ cam ấm, rất ít): chỉ cho lớp hạt trang chủ
  moss: "#5B6B4E"       # accent — điểm phù hợp, trạng thái tích cực, CTA phụ (5.0:1 trên ngà)
  amber: "#B7791F"      # warning — icon, viền, nền nhạt (3.2:1: KHÔNG dùng cho chữ nhỏ)
  amber-ink: "#8F5E12"  # warning-ink — chữ cảnh báo (4.9:1 trên ngà)
  rust: "#B5483B"       # danger — lỗi form, từ chối, xóa (4.7:1 trên ngà)

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
  font-display: "Plus Jakarta Sans (500–700)"
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
- Trung tính ấm + ba màu trạng thái trầm (từ 2026-11-12): không gradient màu, không trắng/đen tuyệt đối.
- Tương phản bằng **xen kẽ sáng/tối** (chỉ trang chủ) và kích thước chữ; màu trạng thái chỉ để báo nghĩa, không trang trí.
- Chữ display Plus Jakarta Sans, tracking âm vừa phải; line-height nới rộng để dấu tiếng Việt không bị cắt.
- Chuyển động phản hồi theo cuộn và đảo ngược được; một khoảnh khắc chính là logo bay từ giữa màn hình vào header.
- Mọi nút hành động là viên thuốc (pill).

## Colors

### Bảng màu
| Token | Hex | Vai trò |
|---|---|---|
| `wm-charcoal` | `#242522` | Nền intro/kết, chữ trên nền sáng, nút chính trên nền sáng |
| `wm-graphite` | `#454640` | Nền tối giữa trang |
| `wm-sage` | `#A6A69A` | Nền tuyên ngôn |
| `wm-olive` | `#858B70` | Viền khung thẻ (chủ dự án chọn) — chỉ làm viền |
| `wm-stone` | `#D9D3C8` | Nền khu việc làm |
| `wm-mist` | `#E1DED5` | Bề mặt phụ, chữ phụ trong menu |
| `wm-ivory` | `#F3F0E9` | Nền sáng chính, chữ trên nền tối |
| `wm-lavender` | `#A99CCB` | Màu nhấn, **chỉ** cho lớp hạt trang chủ (một phần hạt ánh tím). Không dùng cho chữ, nền, nút |
| `wm-ice` | `#9FB7D6` | Màu nhấn xanh băng nhạt, **chỉ** cho lớp hạt trang chủ. Không dùng cho chữ, nền, nút |
| `wm-blush` | `#D8A9A0` | Màu nhấn hồng đào nhạt, **chỉ** cho lớp hạt trang chủ. Không dùng cho chữ, nền, nút |
| `wm-violet` | `#9B7BE0` | Màu nhấn tím rõ, **chỉ** cho lớp hạt trang chủ. Không dùng cho chữ, nền, nút |
| `wm-ember` | `#E0705A` | Màu nhấn đỏ cam ấm (rất ít hạt), **chỉ** cho lớp hạt trang chủ. Không dùng cho chữ, nền, nút |

### Màu nhấn theo vai trò + màu trạng thái (2026-11-12, chủ dự án duyệt)
Màu nhấn đổi theo người đang đăng nhập (`data-role` trên `<html>`, đặt ở `App.tsx`; nguồn `tokens.json → roles`):

| Vai trò | `bg-accent` (nền nút, chấm, viền) | `text-accent-fg` (chữ trên nền accent) | `text-accent-ink` (chữ/link nhấn trên nền sáng) |
|---|---|---|---|
| Nhà tuyển dụng, khách, admin | `wm-clay` #E07A3F | `wm-charcoal` (5.2:1) | `wm-clay-ink` #A34E1C (5.0:1) |
| Người tìm việc | `wm-fern` #257356 | `wm-ivory` (5.0:1) | `wm-fern` (5.0:1) |

Dùng màu nhấn cho: nút chính quan trọng, link, trạng thái "đang rảnh"/tích cực, tag đang chọn, chấm chưa đọc.
**Không** dùng `text-accent` (màu nền làm chữ không đủ tương phản với cam) — chữ luôn là `text-accent-ink`.
`bg-accent-soft` = 8% accent pha nền trang (14% làm chữ nhấn chỉ còn 4.2–4.4:1). Màu nhấn là biến CSS nên không dùng modifier `/opacity`.
(#2F8F6B chủ dự án đề xuất cho người tìm việc không đạt 4.5:1 với cả chữ sáng lẫn tối → dùng bản đậm #257356.)

Màu trạng thái cố định (không đổi theo vai trò):
| Tailwind | Màu | Dùng cho |
|---|---|---|
| `border-warning` / `bg-warning-soft`, chữ `text-warning-ink` | `wm-amber` / `wm-amber-ink` | sắp hết hạn, cần bổ sung |
| `text-danger` / `border-danger` / `bg-danger-soft` | `wm-rust` | lỗi form, từ chối, xóa |

`wm-moss` (#5B6B4E) là accent cũ trong buổi sáng 12/11, không còn dùng. `wm-night` #1C1B19: đen ấm, chỉ cho các
đoạn nền tối của trang chủ (chữ và nút toàn site vẫn là `wm-charcoal`).

### Chữ (2026-11-12)
Cỡ nhỏ nhất 13px (`text-xs` đã đổi), chữ phụ ≥ 14px (`text-sm`), nội dung 16px; nội dung line-height 1.6, tiêu đề 1.2
(display 1.15–1.2). Phân cấp bằng cỡ + độ đậm, không làm mờ màu. Số liệu (lương/giờ, km, giờ ca) `tnum` + đậm hơn chữ quanh.
Font giữ Plus Jakarta Sans (tiêu đề) + Inter (nội dung).

Hạt màu chỉ hiện trên nền tối (intro, banner, section than chì/graphite); trên nền sáng hạt trở về đơn sắc theo màu chữ trang.

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

- **Plus Jakarta Sans** cho display và tiêu đề thẻ; **Inter** cho nội dung (cả hai có bộ chữ tiếng Việt). Tải từ Google Fonts trong `index.html`.
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
| Link/nút nhỏ trong header, menu, ô nhập | `rounded-control` | 0.5rem (8px) |
| Panel, popup nhỏ | `rounded-md` | 0.875rem (14px) — đã đổi từ mặc định Tailwind 2026-11-12 |
| Modal, khối lớn | `rounded-lg` | 1.25rem (20px) — đã đổi từ mặc định Tailwind 2026-11-12 |
| Tấm chuyển cảnh | trong `clip-path` | 2rem → 0 khi phủ kín |

## Components

Component dùng lại được (xem code trước khi viết mới):
- **Chuyển động**: `Reveal` (hiện khi cuộn tới, một lần), `TextReveal` (chữ trồi theo từ, một lần), `MaskedWords` (chữ trong mặt nạ cho GSAP điều khiển theo cuộn, đảo ngược được), `RollText` (chữ cuộn khi hover — cha phải có class `group`), `Magnetic` (nút hút theo chuột), `CustomCursor`.
- **Bố cục**: `PublicLayout` (header + footer), `MenuOverlay`, `RouteScroll`.

**Nút và chip (2026-11-12)** — chỉ dùng hằng trong `src/utils/ui.ts`, không tự định nghĩa trong trang:
| Hằng | Dùng cho |
|---|---|
| `BTN_ACCENT` | Hành động chính của màn hình — **tối đa một nút mỗi màn hình** (Ứng tuyển, Đăng tin, Lưu thay đổi, Gửi, Đăng nhập) |
| `BTN_PRIMARY` | Nút đặc màu chữ trang: hành động quan trọng thứ hai, hoặc hành động lặp lại trong từng hàng/thẻ |
| `BTN_SECONDARY` | Nút viền: hành động phụ |
| `BTN_GHOST` | Nút chữ: Hủy, Xem thêm |
| `BTN_DANGER` | Xóa, từ chối, rút lại |
| `BTN_SM` / `BTN_LG` | Cỡ (ghép sau kiểu nút bằng `cn`) |
| `BTN_ICON` | Nút tròn chỉ có icon (kèm aria-label) |
| `CHIP` + `CHIP_ON` / `CHIP_OFF` | Chip lọc, tab viên; đang chọn = màu nhấn |
| `LINK`, `CARD_HOVER`, `PRESS` | Link nhấn; thẻ bấm được; chuyển động chuẩn cho phần tử bấm được khác |

Mọi phần tử bấm được có: đổi màu 150ms, lún `scale 0.97` khi bấm, vòng focus `FOCUS`, nhánh giảm chuyển động.
Trang chủ được giữ cỡ nút lớn riêng (`BTN_LG`) và `RollText`/`Magnetic` cho CTA của hero.

**Thanh tìm kiếm** — khung `rounded-card` viền `page-edge`, ô `bg-page-surface`, focus có vòng `ring-2 ring-inset ring-page-fg`, nút submit là nút chính.
**Tag** — `border-page-line text-page-muted rounded-full px-3 py-1.5 text-xs`, hover lên `page-fg`.
**Thẻ việc làm** — `bg-page-surface border-page-line rounded-card p-6 md:p-7`, hover viền `page-fg` + mũi tên dịch nhẹ; ghi rõ “Tin mẫu” khi là dữ liệu giả.
**Header (trang chủ)** — cố định, cao 64px, nền `page-bg` + viền `page-line` (chỉ hiện sau intro).
**Focus bàn phím** — trên trang chủ viền 2px `currentColor`, cách 3px; không dùng viền xanh mặc định.

## Motion

**Ba mức thời lượng (2026-11-12)** — class Tailwind `duration-fast|base|slow`, nhịp `ease-editorial`:
| Mức | Thời lượng | Dùng cho |
|---|---|---|
| `duration-fast` | 150ms | bấm, hover, đổi màu |
| `duration-base` | 300ms | mở/đóng (menu, accordion, popup), đổi trạng thái, trượt |
| `duration-slow` | 500ms | nội dung hiện ra khi cuộn tới |

Ngoài trang chủ (chuyển cảnh theo cuộn dùng GSAP) không dùng số thời lượng khác, không dùng `ease-out`/`ease-in`.

Nguyên tắc:
1. **Một khoảnh khắc chính**: logo bay từ giữa màn hình vào header. Các hiệu ứng khác phụ trợ, không tranh.
2. **Theo cuộn và đảo ngược được** cho chuyển cảnh (GSAP ScrollTrigger, `scrub`). Hiệu ứng “xuất hiện một lần” chỉ cho nội dung phụ.
3. **Chỉ transform và opacity**; màu nền đổi qua biến CSS, một listener duy nhất (`useSectionThemes`).
4. Mọi chuyển động có phương án `prefers-reduced-motion` (tắt hẳn hoặc hiện ngay trạng thái cuối) và không phụ thuộc hover cho chức năng chính.
5. Không animation lặp vô hạn không có lý do, không âm thanh.
6. **Phạm vi**: chuyển động nặng (theo tiến trình cuộn, GSAP, con trỏ tùy biến) chỉ ở trang chủ và trang công khai. Dashboard yên tĩnh.
7. **Bốn hiệu ứng điểm nhấn dùng chung mọi trang (2026-11-12, chủ dự án duyệt)** — kể cả dashboard, vì đều nhẹ và chạy một lần:
   | Hiệu ứng | Dùng | Ở đâu |
   |---|---|---|
   | Hiện ra khi cuộn tới | `<FadeIn>` (components/motion) — mờ→rõ + trôi 12px, 500ms, một lần; phần đã ở trong màn hình lúc mở trang hiện ngay | các khối/danh sách nằm dưới màn hình đầu; không bọc từng dòng nhỏ; không dùng ở trang chủ |
   | Thẻ bấm được | `CARD_HOVER` (utils/ui) — viền đậm + nhấc 2px | thẻ là link (thẻ việc, công ty, ứng viên) |
   | Phản hồi thành công | `notifySuccess()` (utils/feedback) + icon `POP` | lưu/bỏ lưu tin, ứng tuyển, quan tâm, kết nối, gửi lời mời/đánh giá/báo cáo; không cho thao tác tự lưu |
   | Sắp xếp mượt khi lọc | `useFlip(keys)` (hooks) + `data-flip-key` | danh sách đổi theo bộ lọc/sắp xếp: /viec-lam (bản danh sách), /match, tìm ứng viên, đơn ứng tuyển, việc đã lưu |
   Chờ tải: skeleton cùng kiểu (`Skeleton`, `SkeletonList`, `SkeletonStats`, `SkeletonCards`, `SkeletonChat` trong components/dashboard) thay cho khoảng trắng hoặc chữ "Đang tải…".

Chi tiết cơ chế: xem `prj-context.md` mục 5 và comment trong `components/home/*`.

## Do's and Don'ts

**Nên**
- Dùng `*-page-*` cho component trang chủ để tự khớp mọi nền.
- Xen kẽ nền sáng/tối để tạo nhịp; để một số section đổi màu đơn giản làm nhịp nghỉ.
- Kiểm tra tương phản khi thêm theme mới (chữ ≥ 4.5:1, viền ô nhập ≥ 3:1).
- Viết nội dung tiếng Việt, ngắn, có quan điểm; dữ liệu giả phải ghi rõ là mẫu.

**Không nên**
- Thêm màu nhấn bão hòa ngoài ba màu trạng thái ở trên, gradient màu, glow, glassmorphism, bóng đổ nặng.
  **Đã gỡ (2026-11-12, chủ dự án quyết):** dashboard và trang Cá nhân `/ca-nhan` về nền ngà phẳng, thẻ đặc
  `page-surface`; bỏ ảnh nền + kính mờ của ngoại lệ dưới đây. Trang chủ giữ nhịp tối–sáng–tối.
  **(Cũ) Ngoại lệ (2026-11-07, chủ dự án duyệt):** khung dashboard 3 vai trò dùng kính mờ trên nền ảnh
  theo `references/p10.mp4` — `.theme-glass` + `.glass-card` (`styles/index.css`), ảnh nền riêng
  từng vai trò, lớp phủ than chì đặc. Vẫn giữ bảng màu charcoal/ivory, không màu nhấn, không glow,
  không bóng ngoài; có phương án đặc khi trình duyệt không hỗ trợ blur hoặc `prefers-reduced-transparency`.
  Kính mờ chỉ dùng trong dashboard, không đưa ra trang công khai.
  **Ngoại lệ thứ hai (2026-11-07, chủ dự án duyệt):** Đăng nhập / Đăng ký / Quên mật khẩu
  (`pages/public/auth/*`) theo `references/p11.mp4` — một thẻ kính **sáng** chia hai nửa trên nền ngà
  có khối hình học màu nhạt; được phép: kính mờ, vệt sáng trắng nhẹ theo chuột, làm nhòe ngắn
  (`filter: blur`) lúc hai nửa đổi chỗ. Mọi hiệu ứng có nhánh giảm chuyển động.
  **Ngoại lệ thứ ba (2026-11-08, chủ dự án duyệt):** trang Việc làm `/viec-lam`, bản cuộn
  (`components/discover/ScrollGallery.tsx` bố cục `jobs`, `pages/public/jobs/JobSearchBar.tsx`). Được phép:
  - **Kính mờ** `.glass-liquid` (kèm bóng mềm của nó) cho: ô tìm kiếm đầu trang, viên thu gọn dính dưới
    header, thanh tìm kiếm nổi khi bấm viên (kính đậm hơn `backdrop-blur-xl`, chip chưa chọn cũng có nền kính),
    và chồng thẻ nội dung cột phải. Thẻ ở giữa hiện chữ; thẻ trên/dưới là khung kính trống, nghiêng theo ảnh;
    thẻ cao ≈80% ảnh để ảnh luôn là khối lớn nhất.
  - **Vệt sáng màu ảnh** dưới ảnh đang xem: bản ảnh 160px làm nhòe mạnh (`blur-[56px]`), đặt sau ảnh,
    chỉ đổi opacity theo cuộn (tối đa 0.55). Màu đến từ chính ảnh, không thêm token màu nào.
  **Ngoại lệ thứ tư (2026-11-13, chủ dự án quyết):** trang Đăng tin `/dang-tin` (`pages/public/PostJobPage.tsx`)
  giữ thẻ kính mờ, nền loang và ảnh minh họa, dù các dashboard khác đã về nền ngà phẳng. Không “sửa” khi rà soát.
  Giới hạn: không mang các hiệu ứng này sang trang công khai khác khi chưa hỏi; bản giảm chuyển động
  (`StaticGallery`) không có vệt sáng. Ô tìm kiếm ở các trang khác vẫn theo mục **Thanh tìm kiếm** ở trên.
- Dùng `#000` / `#fff` tuyệt đối.
- Viết hex trực tiếp trong component — thêm vào `tokens.json` nếu thật sự cần màu mới.
- Đánh số 01/02/03 cho nội dung không phải trình tự thật.
- Đưa hiệu ứng cuộn/con trỏ tùy biến vào dashboard.

## Known gaps & assumptions

- **[giả định]** Thang `title/body/body-sm` ghi theo cách code đang dùng class Tailwind mặc định; chưa có token riêng.
- **[giả định]** Trạng thái lỗi/thành công của form chưa được thiết kế cho bảng màu này (không có đỏ/xanh). Khi cần, ưu tiên biểu tượng + chữ thay vì chỉ màu, và hỏi chủ dự án trước khi thêm màu ngữ nghĩa.
- Màu trong shader nền intro (`HeroCanvas.tsx`) ghi trực tiếp dưới dạng số thực theo charcoal/graphite/ivory — đổi bảng màu thì sửa cả ở đó.
- Skill `frontend-design` liệt kê “nền kem gần #F4F1EA” và “nhãn in hoa phía trên mọi tiêu đề” là dấu hiệu giao diện do AI tạo. Ivory `#F3F0E9` và `.eyebrow` là lựa chọn có chủ đích của chủ dự án — giữ nguyên, nhưng dùng eyebrow tiết chế ở trang mới.
