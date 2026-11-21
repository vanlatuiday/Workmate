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
  ivory: "#FAF4EA"      # nền sáng chính (kem ấm — chủ dự án chọn 2026-11-15, hợp ảnh quán/nhà hàng tông ấm), chữ trên nền tối
  lavender: "#A99CCB"   # màu nhấn: chỉ cho lớp hạt WebGL trang chủ (ParticleField)
  ice: "#9FB7D6"        # màu nhấn (xanh băng nhạt): chỉ cho lớp hạt trang chủ
  blush: "#D8A9A0"      # màu nhấn (hồng đào nhạt): chỉ cho lớp hạt trang chủ
  violet: "#9B7BE0"     # màu nhấn (tím rõ): chỉ cho lớp hạt trang chủ
  ember: "#E0705A"      # màu nhấn (đỏ cam ấm, rất ít): chỉ cho lớp hạt trang chủ
  moss: "#5B6B4E"       # accent — điểm phù hợp, trạng thái tích cực, CTA phụ (5.0:1 trên ngà)
  amber: "#B7791F"      # warning — icon, viền, nền nhạt (3.2:1: KHÔNG dùng cho chữ nhỏ)
  amber-ink: "#8F5E12"  # warning-ink — chữ cảnh báo (4.9:1 trên ngà)
  rust: "#B5483B"       # danger — lỗi form, từ chối, xóa (4.7:1 trên ngà)

  night: "#0A0F0D"      # nền tối (đen ánh rêu) — xem mục Hai nền
  leaf: "#3DDC84"       # màu nhấn người tìm việc trên nền TỐI
  rust-light: "#F08A7B" # danger trên nền tối
  amber-light: "#D9A441" # warning-ink trên nền tối

  # Trang chủ nền xanh (2026-11-19, chủ dự án duyệt) — chỉ dùng ở trang chủ, xem mục "Trang chủ nền xanh"
  ocean: "#0B2FA8"      # xanh biển: màu lót dưới ảnh nền, kính header khi cuộn, quầng xanh sau chữ hero
  abyss: "#05155E"      # xanh rất đậm: nền màn mở đầu (logo Workmate)
  azure: "#1F6FFF"      # xanh dương tươi: lớp nhuộm hai mép nền dưới hero (mix-blend color)
  cyan: "#5FE6F7"       # xanh ngọc: vòm sáng màn mở đầu, quầng sáng sau tiêu đề hero, viền nhạt quầng cam
  apricot: "#FF9457"    # cam: lõi quầng cam (đáy hero, sau khối tuyển dụng), dải tuyển dụng
  peach: "#FFC7A3"      # đào: viền quầng cam, đầu kia dải tuyển dụng
  tangerine: "#F58A4C"  # cam nhấn sáng hơn clay — --accent của trang chủ (trừ người tìm việc: giữ xanh lá)
  iris: "#5B4CF0"       # (thôi dùng 2026-11-20 — dải tuyển dụng đổi sang cam–đào; giữ token để tránh vỡ)
  magenta: "#D8338F"    # (thôi dùng 2026-11-20, như trên)

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
  font-display: "Plus Jakarta Sans (400–700)"
  font-body: "Inter (400–700)"
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
| `wm-ivory` | `#FAF4EA` | Nền sáng chính (kem ấm), chữ trên nền tối |
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
| Người tìm việc | `wm-fern` #1B7D45 | `wm-ivory` (4.8:1) | `wm-fern` (4.8:1) |

Dùng màu nhấn cho: nút chính quan trọng, link, trạng thái "đang rảnh"/tích cực, tag đang chọn, chấm chưa đọc.
**Không** dùng `text-accent` (màu nền làm chữ không đủ tương phản với cam) — chữ luôn là `text-accent-ink`.
`bg-accent-soft` = 8% accent pha nền trang (14% làm chữ nhấn chỉ còn 4.2–4.4:1). Màu nhấn là biến CSS nên không dùng modifier `/opacity`.
(Chủ dự án đề xuất #1F8A4C, nhưng chữ ngà trên đó chỉ ~4.0:1 → dùng #1B7D45, 4.7:1 trên #FAF4EA. Trước 2026-11-15 là #257356.)

Màu trạng thái cố định (không đổi theo vai trò):
| Tailwind | Màu | Dùng cho |
|---|---|---|
| `border-warning` / `bg-warning-soft`, chữ `text-warning-ink` | `wm-amber` / `wm-amber-ink` | sắp hết hạn, cần bổ sung |
| `text-danger` / `border-danger` / `bg-danger-soft` | `wm-rust` | lỗi form, từ chối, xóa |

`wm-moss` (#5B6B4E) là accent cũ trong buổi sáng 12/11, không còn dùng. `wm-night` #0A0F0D (từ 2026-11-15; trước đó #1C1B19): đen ánh rêu — nền tối của trang chủ, đăng nhập/đăng ký, form bắt đầu
(chữ và nút trên nền sáng vẫn là `wm-charcoal`).

### Hai nền (2026-11-15, chủ dự án duyệt — giai đoạn 1/3)
Mọi trang là sự đan xen của hai bề mặt; không bao giờ đen/trắng tuyệt đối.

| | Nền tối | Nền sáng |
|---|---|---|
| Màu nền | `wm-night` **#0A0F0D** (đen ánh rêu) — class `.theme-night` | `wm-ivory` **#FAF4EA** (kem ấm) — `.theme-ivory` |
| Thẻ | nền `rgba(255,255,255,.04)` (kính: tới .08), viền mảnh `rgba(255,255,255,.08)` | bề mặt trắng ngà + bóng mềm |
| Hạt bụi | có (`DustField`, xem dưới) | không |
| Chữ | ngà #FAF4EA; chữ phụ 82% (≈10,6:1 trên kính tối) | than chì; chữ phụ 82% |

**Màu nhấn theo bề mặt** (vẫn theo VAI TRÒ — người tìm việc xanh lá; khách/nhà tuyển dụng/admin cam đất). Bề mặt tối tự hoán đổi
`--accent*` sang bản `accent-dark*` (`.theme-night`, `.theme-charcoal`, `.surface-dark` trong `index.css`), nên `BTN_ACCENT`, `text-accent-ink`
dùng nguyên không cần class riêng:
| Vai trò | Nền sáng: nền nút / chữ trên nút / chữ nhấn | Nền tối: nền nút / chữ trên nút / chữ nhấn |
|---|---|---|
| Người tìm việc | `fern` #1B7D45 / ngà / `fern` — 4,8:1 | `leaf` #3DDC84 / `night` / `leaf` — 10,8:1 |
| Khách, nhà tuyển dụng, admin | `clay` #E07A3F / than chì / `clay-ink` #A34E1C | `clay` / `night` (6,5:1) / `clay` (6,5:1 trên night) |
Màu trạng thái trên nền tối: `--danger` = `rust-light` #F08A7B (7,0:1 trên kính tối), `--warning-ink` = `amber-light` #D9A441 (7,6:1);
`text-danger`, `text-warning-ink`, `bg-danger-soft` tự đổi theo bề mặt.

**Header đổi màu theo khối bên dưới** (trang công khai ngoài trang chủ): khối tự đánh dấu `data-surface="dark"` hoặc `"light"`;
`useHeaderSurface` (IntersectionObserver trên dải 2px ngay dưới mép header) chọn `.theme-night` / `.theme-ivory` cho header —
chữ sáng trên khối tối, chữ tối trên khối sáng. Không có khối đánh dấu → ngà như cũ. Trang chủ giữ logic riêng (`useHomeHeader`). Giảm chuyển động: đổi tức thì.

**Hạt bụi** (`components/motion/DustField.tsx`, canvas 2D): hạt 1–2px, độ đục 0,2–0,6, trôi rất chậm; `density="low"` (thưa) cho dải đầu trang con.
≤ 30 khung/giây, dừng khi ẩn tab/khuất khối; giảm chuyển động → một khung tĩnh. Trang chủ vẫn dùng `ParticleField` WebGL riêng.

**Lộ trình**: giai đoạn 1 (đã làm) = token, header tự đổi màu, đăng nhập/đăng ký/quên mật khẩu và form bắt đầu nền tối kính tối.
Giai đoạn 2 = trang con công khai: dải đầu trang tối có hạt bụi + nội dung trắng ấm + footer tối; popup = thẻ trắng trên màn phủ tối
(bands phải trải dưới cả header — header hiện là thanh sticky trong luồng nên lúc đó cần chồng lên dải). Giai đoạn 3 = danh sách công ty `/cong-ty` toàn tối.
`/ca-nhan` (Câu chuyện của tôi) cùng nền kem như mọi trang — chỉ khác kiểu chữ và bố cục, không khác màu; riêng footer của trang này tối có hạt bụi như trang chủ (PublicLayout, `nightFooter`).

### Trang chủ nền xanh (2026-11-19, chủ dự án duyệt — thay nền ngà/than chì ở TRANG CHỦ)

Chỉ áp dụng cho trang chủ `/`. Các trang khác vẫn theo mục **Hai nền** ở trên. Đây là ngoại lệ có chủ đích với
"không gradient / glow / kính mờ / bóng" trong Do's and Don'ts — đừng "sửa" khi rà soát.

**Nền** (`components/home/homeBackground.ts`, `HomeBackdrop.tsx`, ảnh `src/assets/images/home-bg-*`; gốc `references/backgr.png`):
- ① Màn mở đầu: nền `abyss`→`ocean` phủ kín ảnh + **vòm sáng xanh** hình cầu ôm phần dưới màn hình (không cam). Lướt xuống:
  vòm nở ra, lớp phủ mờ dần lộ hero, cuối cùng cụm cam dâng lên.
- ① Hero: ảnh tia sáng xanh ngọc ở giữa, **cam chỉ ở đáy** (nón cam nhô cao + quầng + dải cam–đào dọc mép nối hai góc hồng).
  Hồng hai bên **chỉ có ở hero**.
- Dưới hero → hết trang: **một cột tia sáng ở chính giữa, to nhỏ lượn sóng**, hai bên tối dần (chiều sâu), sao nhỏ. Không cam,
  không hồng (lớp nhuộm `azure` hai mép). Chỗ nối hero → phần dưới: ảnh hero soi gương + quầng cam tắt nhanh — không vết cắt.
- Cam lần thứ hai **chỉ sau khối tuyển dụng** (quầng cam mềm quanh khối). Mép dưới trang tối dần sang `night` của chân trang.
- Vùng sáng của ảnh đã làm mịn sọc dọc; vùng tối giữ sao và sợi mờ.

**Chuyển động nền** (đều có nhánh `prefers-reduced-motion` → đứng yên): tia sáng "thở" (bản sao sáng hơn ở cột giữa,
6 s, tối đa 45%); sóng tia sáng, sao và quầng cam trôi chậm hơn nội dung (nhẹ); không có gì khác chạy theo nền.

**Chữ & thẻ trên nền xanh:**
- Mọi section dưới hero `data-theme="night"` → chữ ngà. Tiêu đề không dùng text-shadow (mặt nạ từng từ cắt bóng thành ô).
- Thẻ việc, 3 thẻ tính năng, 3 thẻ tính năng ở hero (đã đổi sang kính tối): **kính trắng** (`bg-wm-ivory/75–84` + blur + `LIGHT_CARD_VARS` ghim chữ than chì).
- Ô/nhãn/nút nhỏ nằm thẳng trên nền: **kính tối** `HOME_GLASS_DARK` (`bg-wm-night/35` + blur) để chữ ngà đọc được trên vệt cam.
- Khối tuyển dụng: dải **cam–đào** (`apricot`→`peach`), chữ than chì, nút tối; phóng nhẹ khi cuộn tới.
- Header: ba cụm kính nổi, không nền toàn chiều rộng (xem mục Header). Màu nhấn trang chủ `tangerine` (người tìm việc vẫn `fern`/`leaf`).

**Hero (2026-11-21, theo mockup của chủ dự án):** nhãn "Nền tảng việc làm linh hoạt" là **viên kính** (ngà 10% + viền ngà 20% + blur) kèm biểu tượng `Sparkles` cyan.
Tiêu đề hai dòng lớn + quầng sáng xanh ngọc phía sau; **dòng 2 màu `cyan`, chữ nghiêng** (Plus Jakarta Sans có nạp kiểu nghiêng 600/700) kèm **nét vẽ tay** bên dưới (cùng kiểu StatementSection).
Ô tìm kiếm là **thanh kính** (`abyss` 45% + viền cyan 40% + quầng cyan nhẹ), hai ô Search/MapPin ngăn bằng vạch mảnh, nút gửi **cyan đặc, chữ `abyss`, biểu tượng `Send`** ("Tìm việc");
hàng "Tìm nhiều:" (biểu tượng `Flame` màu `apricot`) + các thẻ ngành kính viền (`heroTags`). Không còn nút "Xem việc phù hợp với tôi" dưới hàng thẻ ngành.
**3 thẻ tính năng kính** (`HeroFeatureCards`, thay 3 thẻ vai trò nghiêng) theo vai trò (`heroFeatures` trong content.ts): `.shift-card` + ô biểu tượng 64px gradient azure→cyan + tiêu đề + mô tả + liên kết có mũi tên + nút tròn
mũi tên (trang trí); cả thẻ là một `<Link>`. Nổi lên lần lượt trong timeline intro (`data-hero-card`). Chỉ hiện từ `lg` và khi màn cao ≥ 820px.
**Chỉnh sửa hero (2026-11-21, vòng 2):** thẻ tính năng là **kính xanh trong** (`.hero-fcard`: azure→ocean 74–82%, blur 18px, viền ngà 35%, quầng cyan; không dùng abyss vì ngả tím trên quầng cam; chữ ngà ≥ 5:1 kể cả trên apricot). Ô biểu tượng có khối (`.hero-ftile`: viền sáng trên, quầng góc, bóng đổ). Ô tick kính nghiêng 12° lơ lửng ±5px đè mép phải thẻ giữa (`.hero-tick`, đặt ở `li`, không bắt chuột).
6 sao 4 cánh lấp lánh rất chậm (`HeroSparkle`: 4 quanh hai ảnh chỉ từ `lg`, 2 ở góc tiêu đề từ `md`; giảm chuyển động thì đứng yên). Nút chuột cuộn (`button`, cuộn mượt tới section sau hero) ở giữa đáy hero, cùng điều kiện hiện với hàng thẻ (lg + cao ≥ 820px); "Cuộn để bắt đầu" thuộc màn mở đầu, không trùng. Khoảng chữ → thẻ ~44px, cả khối căn giữa dọc.
**Ô ảnh 3D hai bên** (`heroArt` trong content.ts, `HeroSideArt`): để `null` thì không dựng gì; có ảnh thì hiện từ `lg`, trang trí (`aria-hidden`), nằm trong lề hai bên,
vòng quỹ đạo cyan mảnh sau ảnh, lơ lửng ±8px chậm (tắt khi giảm chuyển động). Các lớp (quầng sáng, tiêu đề, ô tìm kiếm, thẻ)
trôi nhẹ theo chuột với độ sâu khác nhau (chỉ chuột thật).

**Khoảnh khắc** (theo taste skill, viết lại bằng GSAP; tối đa 2 mỗi trang): ảnh thẻ ca dưới hero "hiện dần" từ xám sang màu
một lần khi cuộn tới (`ShiftBoardSection`) và phần câu nhấn `StatementSection` hiện dần nhẹ một lần khi vào khung nhìn (chủ dự án đã duyệt 2026-11-21, thay cho chữ sáng dần từng từ). Vòng tròn mở khối tuyển dụng đã bỏ (2026-11-20). Không thêm khoảnh khắc thứ ba; chỉ một hiệu ứng theo chuột mỗi trang (đã dùng ở hero).

**StatementSection (2026-11-21, làm lại theo mockup):** 3 vùng ở `lg` (chữ ~38% · ảnh bàn làm việc giữa, lấn sang hai bên · 3 thẻ ~36% phía trên ảnh); `md` chữ trên, ảnh + thẻ dưới; điện thoại xếp dọc. Nhãn kính "Kết nối cơ hội • Kiến tạo tương lai", tiêu đề có "cả hai bên" màu `cyan` + nét gạch tay, mô tả và hai nút theo vai trò (nút chính `cyan` chữ `abyss` có quầng; nút phụ viền ngà; lớp `.stmt-btn*`). Ảnh đứng trên bệ sáng mờ; nhãn nghiêng -6° hiện "{N} ca đang tuyển tuần này" (N = số ca 7 ngày tới từ `shiftsOf`, như bảng ca; ẩn khi 0). Thẻ dùng `.shift-card`, icon nền gradient `cyan`→`azure`. Nền: 3 dải cong sáng riêng của section, mask mờ ở mép trên/dưới. Chuyển động: hiện dần lần lượt (opacity + y 18px, ScrollTrigger once), ảnh và nhãn lơ lửng ±6px rất chậm; giảm chuyển động thì hiện sẵn, không tween.

**Thẻ nghề ở "Ca khớp lịch rảnh" (2026-11-21, làm lại theo mockup):** thẻ kính tối (`abyss` 55% + blur 16px + viền `cyan` 35% + quầng `cyan` mềm, class `.shift-card`). Nửa trên là khung ảnh 4:3 (ảnh nghề lấp kín khung, đã nhuộm nhẹ tông xanh; rê chuột/focus thì nhấc 6px); thẻ đang mở bỏ tỉ lệ 4:3 và cao bằng các thẻ đóng. Bên dưới: icon tròn lucide + tên nghề (giữ chỗ 2 dòng), số ca (cyan, `tnum`) + số doanh nghiệp, pill "Ca gần nhất" có icon đồng hồ, nút viền "Xem ca làm" (chỉ nút này mở danh sách doanh nghiệp). Hàng lọc dưới tiêu đề: nhóm kính chọn buổi (Tất cả/Sáng/Chiều/Tối, có icon) + vạch ngăn + chip ngày (Cả tuần, T2 đến CN); mục chọn = nền `cyan` chữ `abyss`; lọc thật, tính lại số ca/doanh nghiệp/ca gần nhất/danh sách từ cùng dữ liệu ca, đổi lọc thì đóng thẻ và đưa băng chuyền về đầu. Nút mũi tên băng chuyền khi bị khóa vẫn có viền ngà 60%. Pill "Ca gần nhất" là kính trong (ngà 15% + viền ngà 25% + blur). Điện thoại: vuốt ngang (thẻ 80% bề rộng, snap, thẻ sau ló mép), bấm "Xem ca làm" thì danh sách nở ngay dưới thẻ.

**Rà soát cuối (2026-11-20):** phần dưới hero phủ thêm `abyss` 34% (`.home-page-dim`) và tia sáng "thở" nhẹ hơn (tối đa 22%) — hero là điểm sáng nhất trang. Header: không còn dải nền khi cuộn (2026-11-21), chỉ ba cụm kính. Hai họ thẻ: **kính tối** (`abyss` 55–65% + blur 16px + viền ngà 20–25% + vạch sáng mép trên) cho thông tin — kể cả 3 thẻ tính năng ở hero — và **ảnh có đáy tối** cho việc làm; dải cam–đào là điểm nhấn ấm duy nhất. Chữ nằm trên cột tia sáng phải đặt trong kính tối. Chữ tối thiểu 12px. Các phần dưới hero cùng lề `max(16px, 2.5vw)` và cùng khoảng `py-section-sm`.

**Việc mới đăng (2026-11-20):** vòng ảnh "rọi đèn" ô giữa (`.nj-slot`: phóng 1.12, viền ngà sáng, vầng xanh ngọc + bóng sàn; ô bên tối/nhạt/mờ nhẹ theo góc), tấm thông tin dạng vé gối lên ảnh giữa (kính `abyss` 60%, lương + ca thành viên nổi, nút ngà đặc), dải chữ nhỏ ~30% với bản lặp chỉ viền chữ, nút dừng dải chữ dạng icon. Section đặt `z-20` để quầng cam của khối tuyển dụng không phủ lên.

**Điều chỉnh trang chủ sau rà soát ngày 21/11, chủ dự án duyệt mục 1–5.** Đoạn giới thiệu ngắn luôn hiện trên điện thoại và laptop màn thấp, ghi rõ Đà Nẵng. Ô địa điểm ở hero và cuối trang chọn khu vực trong thành phố. Tiêu đề và các bước giới thiệu rút gọn. Việc mới đăng lấy sáu tin theo ngày đăng giảm dần, dưới 768px hiện ba thẻ ngang gọn cùng liên kết xem tiếp. Nền nội dung phủ abyss tăng dần tới 48% ở 12svh và 52% ở 60svh, tia sáng thở tối đa 12%, sao CSS 20%, hạt WebGL 30% so với trước. Viền bắt sáng của thẻ nội dung giảm nhẹ.

**Chữ (2026-11-20):** nút = động từ + việc ("Xem việc mới đăng", "Đăng tin tuyển người"), không "Xem tất cả"/"Xem chi tiết";
không câu "X, không phải Y"; không dấu gạch dài "—" trong chữ hiển thị; không nhãn in hoa trên tiêu đề section;
tiêu đề section không là câu hỏi (riêng tiêu đề hero giữ câu hỏi — chủ dự án chọn).

**Chữ (2026-11-20, rà soát):** không "—" trong chữ hiển thị; không tiêu đề câu hỏi (trừ tiêu đề hero trang chủ); không "Xem tất cả" (dùng động từ + đối tượng, vd. "Xem mọi đơn ứng tuyển"); dùng "…" thay "..."; không nhãn in hoa; thông báo thành công không dấu "!"; "Bán thời gian"/"Toàn thời gian" thay "Part-time"/"Full-time"; hai họ chữ (Plus Jakarta Sans, Inter).

### Trang bìa các trang khác (2026-11-20, chủ dự án chọn phương án c — đang làm thử 3 trang)

`components/common/PageCover.tsx`, dùng lại ảnh nền trang chủ:
- **lg** (trang giới thiệu, thử ở `/nha-tuyen-dung`): ~60svh, ảnh hero + tia "thở" + ánh cam rất nhẹ, phủ abyss; chữ trái, h1 2 dòng, một câu, một nút accent.
- **md** (khám phá, thử ở `/viec-lam`): ~34svh, cột tia sáng, không cam; h1 + số liệu thật + ô tìm kiếm kính tối trong bìa.
- **strip** (khu quản lý, thử ở `/tim-viec`): 140–168px, tĩnh hoàn toàn; breadcrumb + h1 + nút; vạch 2px màu vai trò ở đáy.
- Mọi cấp: chữ hiện một lần khi tải (`.pc-rise`), không chạy theo cuộn. Mép dưới bìa tan về cùng màu đầu `DarkPageBody` (`.pc-cover-fade` / `.pc-body-fade`).
- **Dưới bìa:** trang công khai → `DarkPageBody` (nền sóng tia sáng tĩnh + abyss tối dần, chữ ngà, thẻ kính tối) và footer tối (`PublicLayout` `DARK_BODY_PATHS`); khu quản lý → nội dung giữ nền ngà, chỉ dải trên cùng xanh.
- `/viec-lam`: ô tìm kiếm và thẻ chi tiết đổi từ `glass-liquid` ngà sang kính tối (thay mô tả ở "Ngoại lệ thứ ba").
- `/match` (Kết nối, 2026-11-20): bìa md + nền tối; tab và nút chế độ xem dạng kính tối, mục chọn màu ngà; WebGL bỏ ánh vàng ấm (xám trung tính khi nghỉ). MatchDetail và ngăn Tiêu chí vẫn là tấm ngà.
- **Nền nội dung lặng hơn (2026-11-20, chủ dự án duyệt phương án B):** bìa giữ nguyên độ sáng; `DarkPageBody` tối dần khi cuộn (`.pc-body-dim`: abyss 30% → 62% trong 140svh), tia sáng dạt ra hai mép nhờ lớp `.pc-body-calm` (cột giữa abyss 60% từ 30% đến 70% ngang + night 22% cho bớt bão hòa), không còn tia sáng "thở" trong thân trang. Cả hai lớp dùng chung mặt nạ tan từ 0 ở đầu nên nối liền với bìa. Dải mỏng ảnh 60%.
- **Tấm ngà (2026-11-20, đang thử; đã bỏ ánh màu vai trò vì không hiệu quả):** `<PageCover sheet>` bỏ lớp tan dần `.pc-cover-fade` (đáy bìa giữ abyss, mép gọn) và nội dung bọc bằng `IvoryPageBody` (tấm ngà bo góc trên `rounded-lg`, kéo lên 24px, `data-surface="light"`) — sửa vết chuyển xanh → ngà bị đục. Thử ở `/cong-ty`.
- **Hiệu ứng:** thẻ không có liên kết chỉ sáng viền/icon/góc khi rê (không nhấc); thẻ có liên kết nhấc 2px. `/nha-tuyen-dung` có 1 khoảnh khắc: đường nối "Quy trình" sáng dần, vòng số sáng khi đường chạm tới (dọc trên điện thoại). `/viec-lam`: thẻ chi tiết viền + quầng xanh ngọc, công ty đang xem có vạch sáng. Khu quản lý: chỉ hiệu ứng khi rê (ô số liệu, dòng việc phù hợp).

### Nền ban ngày cho trang công khai (2026-11-21, chủ dự án duyệt)

**Bản thử riêng trang Việc làm (22/11/2026, chủ dự án đồng ý thử).** Chỉ đúng `/viec-lam` dùng `page-bg-jobs-preview.webp` (1672×941, ~13 kB), bản chỉnh bằng imagegen từ ảnh xanh/trắng chủ dự án gửi. Yêu cầu chỉnh ảnh giữ bố cục sáng giữa/trái và dải xanh bên phải, bỏ hai nhãn AI, giảm mật độ/độ sáng sao khoảng 70%, dịu mảng xanh phải khoảng 20%, không thêm chữ hoặc vật thể. `cover` giữ tỷ lệ, mobile căn `58% center`; lớp sương `day` 24% ở vùng giữa giúp đọc chữ. Theo yêu cầu tiếp theo, nền trôi dọc từ +24 xuống −24px theo toàn trang (mobile +12 xuống −12px), GSAP `scrub: 0.35`, chỉ transform một lớp ảnh. Tràn 28px trên desktop/16px trên mobile để mép nền luôn kín; giảm chuyển động giữ nền tĩnh, không giữ lớp compositor riêng. ResizeObserver cập nhật mốc cuối khi danh sách đổi chiều cao, hiệu ứng được gỡ khi đổi trang. Không chồng `.day-sky` hoặc sao CSS lên ảnh. Bộ lọc và thẻ nội dung giữ mặt sáng hiện có. Trang chi tiết việc, công ty và các trang khác giữ nền ban ngày cũ trong khi chờ nhận xét bản thử.

**Thay quy tắc bìa xanh + nội dung tối (20/11) cho các trang dưới đây.** Trang chủ, đăng nhập/đăng ký, dashboard, `/ca-nhan`, `/ho-so`, `/tin-nhan`, `/thong-bao`, `/lich-phong-van`, `/vi-tri/:id`, `/ung-vien/:id`, `/xem-thu` giữ nguyên. Đây là ngoại lệ có chủ đích (chủ dự án duyệt) với quy tắc "không gradient/glow ngoài trang chủ" của workmate-ui.
- **Danh sách trang** (`DAY_PATHS` trong `PublicLayout`): `/viec-lam`, `/viec-lam/:id`, `/cong-ty`, `/cong-ty/:id`, `/match`, `/nha-tuyen-dung`, `/gioi-thieu`, `/lien-he`, `/ho-tro`, `/cam-nang`, `/cam-nang/:slug`, `/dieu-khoan`, `/bao-mat`, `/ho-so` (thêm 22/11: trang hồ sơ bỏ nền ngà, ô nhóm và khung xem trước dùng `.day-card` trắng), `/dang-tin` (thêm 22/11, chủ dự án yêu cầu làm lại theo phong cách `/ho-so`: dải trạng thái + nút Đăng tin, mục lục, vòng hoàn thiện, nhóm `day-card`, thẻ xem trước bên phải) và 404 (đường dẫn không thuộc danh sách trang giữ kiểu cũ).
- **Màu:** token mới `day` #F5F8FE (nền), `day-tint` #E8F0FC (mặt ô nhập/thẻ), chữ `abyss` #05155E. `.theme-day`: `--page-muted` abyss 76% (4,76:1 trên điểm xanh nhất #99CAFC của ảnh nền; chữ chính 9,6:1), `--page-line` abyss 13%, `--page-edge` abyss 40%.
- **Nền `DayBackdrop`** (`components/layout/DayBackdrop.tsx`, ảnh `assets/images/page-bg-day.webp`): cố định, sau nội dung; MỘT lớp ảnh nhòe trên mọi dạng màn hình; độ nhòe (~14px trên màn) và giảm bão hòa 0.85 đã **làm sẵn trong file ảnh** (512×768, ~4KB) — không dùng CSS `filter` vì lớp này được phóng theo cuộn, filter sẽ phải vẽ lại mỗi khung hình; `opacity: 0.6` trên nền `day` (đã làm dịu theo góp ý 21/11: bản đầu saturate 1.15, opacity 1 bị chói), tràn `-60px` để mép nhòe không lộ. Lớp "sương" trắng ở giữa: `radial-gradient(ellipse 52% 64% at 50% 52%, day 70%, trong suốt 82%)`.
- **Nối với trang chủ (mức B, chủ dự án duyệt 21/11 tối):** thêm 2 lớp tĩnh trên cùng của `DayBackdrop` — `.day-sky` (mép trên azure 22% → trong suốt ở 28%, mép dưới azure 18%, viền góc azure 14%, cột sáng `cyan` 22% hẹp ở giữa) và `.day-sky-stars` (chấm sao azure 1–1,4px, độ đục 0,45). Không chạy theo cuộn; giữa trang vẫn sáng để chữ đủ tương phản. Đừng đậm hơn: chủ dự án muốn "liên kết nhưng không nổi bật".
- **Nhịp cuộn (GSAP + ScrollTrigger, chỉ transform):** mở trong 1,6 chiều cao màn đầu (ảnh scaleX 1→1,12, scaleY 1→1,38; sương scaleX 1→1,35), giữ, rồi khép về ~15% trong 1,6 màn cuối; làm mượt 0,6s. Giảm chuyển động → tĩnh.
- **Chân trang:** nền abyss + chữ ngà + hạt bụi (`.theme-abyss`); ngay trên là đoạn hoàng hôn ~190px (`.day-dusk`: azure 0 → azure 16% → ocean 62% → abyss 92% → abyss) kéo `-mt-10`.
- **Một màu nút chính:** trên trang ban ngày `BTN_ACCENT` hiện abyss (chữ day); màu vai trò chỉ còn ở chi tiết nhỏ (thanh điểm phù hợp, chấm). Nút nổi tin nhắn/thông báo cũng abyss (`html[data-day]`, DayBackdrop đặt). Thẻ chờ trong bộ ảnh công ty ẩn hẳn (chỉ thẻ đang xem hiện).
- **Header:** ba cụm kính trắng 75% + viền abyss 8% (không dải nền toàn chiều rộng); mục đang mở nền abyss, chữ `day` (`data-day` trên `.site-header`, `useHeaderSurface` trả `'day'`).
- **Link chữ:** `text-accent-ink` = abyss trên nền ban ngày (xanh lá/đất nung chỉ đạt 3,0–4,3:1); hover gạch chân cách 4px. Nút `bg-accent` giữ màu vai trò.
- **Thẻ:** trắng + viền mảnh + bóng nhẹ; thẻ mờ (ghost) = xanh nhạt `azure` 6% + viền abyss 8%, không bóng (`.day-ghost`); không quầng `jobs-card-halo`. `COVER_GLASS` = kính trắng 85% + viền `page-line`.
- **Bìa/thân trang:** `PageCover` lg/md nhận kiểu sáng (không lớp nền, chữ abyss) khi nằm trong trang ban ngày (`DayContext`); `DarkPageBody`/`IvoryPageBody` thành khung trong suốt. Dashboard `/tim-viec/match`, `/tuyen-dung/match` dùng chung các thành phần này nên vẫn giữ kiểu tối cũ. `strip` không đổi.
- **Hiện dần khi cuộn:** `FadeIn` trong trang ban ngày trồi 28px, 800ms, so le nhẹ; giảm chuyển động → hiện ngay.

### Header (QUY TẮC CỐ ĐỊNH — chủ dự án chốt 2026-11-21, thay quy tắc "ẩn khi cuộn xuống" của 2026-11-16)
Áp cho MỌI trang có thanh trên cùng (PublicLayout → `SiteHeader`), kể cả trang chủ; thanh trên của dashboard (DashboardShell) không thuộc quy tắc này. Không đổi khi chưa hỏi chủ dự án.
- **Hình thức — chỉ ba cụm kính nổi, KHÔNG có nền toàn chiều rộng** (không viền đáy, không dải kính chạy hết bề ngang; giữa các cụm thấy nền trang, click xuyên xuống trang):
  1. **logo** (trái): icon cặp + "Workmate", nằm trong **viên kính riêng** hiện khi cuộn quá 40px (đầu trang để trần; màn mở đầu trang chủ luôn trần);
  2. **viên menu** (giữa);
  3. **cụm tài khoản / Đăng nhập** (phải).
  Cố định trên cùng, hàng cao 72px, lề ngang 24 / 40 / 56px. Chữ 16px in đậm (600). Rê chuột: chỉ **sáng lên**. Dưới 1024px: chỉ viên logo + nút 2 gạch.
  Tông theo khối bên dưới (`data-surface`):
  - **nền tối** (trang chủ các khối đêm, bìa tối): kính tối — abyss 55% + nhòe 16px + viền ngà 20%; mục đang mở như cũ;
  - **nền ban ngày** (`data-day`): kính trắng 75% + viền mảnh abyss 8% + bóng nhiều lớp mềm; mục đang mở = viên abyss chữ `day`;
  - **nền trắng/kem** (kiểu "kính trắng nổi" 2026-11-16): kính trắng rgba(255,255,255,.72–.8), nhòe 14px, viền rgba(22,24,22,.08–.1), bóng nhiều lớp (cuộn quá 40px thì đậm hơn); mục thường #4A4D4A; mục đang mở = viên #161816 chữ #F6F2E8, trượt 0,4s sang mục mới. Biến `--nav-*` / `--lp-*` (viên logo) trong index.css. Trang chủ áp kiểu này khi khối đang xem sáng (`html[data-home-tone]`).
- **Co lại thay vì ẩn — header KHÔNG BAO GIỜ ẩn** (trừ màn mở đầu trang chủ: chỉ logo + nút menu):
  - **Mở rộng** (mặc định): kích thước như trên. **Thu nhỏ** (`html[data-header-compact]`): mỗi cụm `scale(~0,86)` quanh mép trên + nhích lên 6px (còn ~8px cách mép trên, hàng nhìn thấy ~56px), chỉ transform, 0,3s ease-out; giảm chuyển động → đổi tức thì. Phần tử header vẫn cố định 72px nên nội dung trang không xê dịch. Dưới 1024px cũng vậy.
  1. **Cuộn xuống** (quá 80px, bỏ qua xê dịch < 6px) → thu nhỏ — kể cả khi chuột đang nằm yên trên header hoặc vừa bấm logo/link.
  2. **Cuộn lên**, hoặc về gần đầu trang (< 80px) → mở rộng.
  3. **Chuột bước vào header / dải 80px trên cùng** (chỉ chuột/bút) → mở rộng. Chuột rời đi mà hướng cuộn cuối là xuống và còn > 80px → thu nhỏ lại sau ~400ms. Chuột chỉ nằm yên không kéo header mở lại và không chặn lệnh thu nhỏ khi cuộn.
  4. **Đổi trang** (bấm link header, logo, hay bất kỳ đổi route nào) → trang mới bắt đầu ở trạng thái mở rộng, tới lần cuộn xuống kế tiếp. Trang chủ: lần tự cuộn tới banner lúc vào trang (≈0,9s) không làm thu nhỏ.
  5. **Focus bàn phím** (`:focus-visible`) trong header hoặc **menu xổ đang mở** (`aria-expanded="true"`) → giữ mở rộng. Focus do bấm chuột KHÔNG tính (bấm logo/link để lại focus trong header; tính nó thì header không bao giờ thu nhỏ nữa — lỗi cũ).
- **Code**: `components/layout/SiteHeader.tsx` (ba cụm: `.hd-logo`, `.hd-cluster-c`, `.hd-cluster-r`), `hooks/useHeaderScroll.ts` (máy trạng thái, mọi trang kể cả trang chủ), `components/home/useHomeHeader.ts` (chỉ đặt `data-header="hero|full"` cho màn mở đầu). Trạng thái thu nhỏ = `html[data-header-compact]`; "đã cuộn" = `header[data-scrolled]`.

### Dashboard người tìm việc — xanh kính (2026-11-21, chủ dự án duyệt)
**Thay quy tắc nền dune/kính kem bên dưới CHO khu `/tim-viec/*` và (từ 2026-11-22) `/tuyen-dung/*`** (quản trị giữ nguyên dune). Cách bật: `JobseekerLayout` / `RecruiterLayout` dùng `GlassDashboardShell` (prop `sidebarRole`, `menuLabel`), không phải `DashboardShell`.
- Khung: gốc `.jd-root .theme-abyss` (chữ ngà trên abyss), nền tĩnh `.jd-backdrop` (quầng azure/cyan) + `.home-stars`; trang cuộn theo cửa sổ.
- Trên cùng: `SiteHeader` công khai (viên kính nổi, thu nhỏ khi cuộn, xem "Header rule"); ô tìm trên cùng đã bỏ, còn "Tìm trang ⌘K" trong thanh bên. Dưới md: nút "Menu khu tìm việc" mở ngăn kéo; hamburger của header mở menu phủ.
- Thanh bên: `Sidebar glass` = kính abyss 55% + viền cyan 26%, dính dưới header; mục chọn = viên kính sáng + icon cyan; huy hiệu `bg-danger`; chân là thẻ "Cập nhật lịch rảnh" (`SidebarGlassFooter`) + Đăng xuất. Hover các mục giữ nguyên (viên kính lỏng).
- Thẻ: `.jd-card` (abyss 52%, blur 16px, viền cyan 25%, quầng cyan); `.dash-card` và thẻ `rounded-card bg-page-surface` trong khu này tự nhận cùng kiểu qua `.jd-root`. Hover nhấc 2px (`.jd-lift`).
- Khu nhà tuyển dụng: cùng khung; chân thanh bên là thẻ "Đăng ca mới" (hình cặp 3D, nút "Đăng tin" → /dang-tin). Tổng quan `/tuyen-dung` (`pages/recruiter/Dashboard.tsx`, dùng lại `JdCard`/`OverviewTabs` của `jobseeker/overview/parts`): thẻ công ty (logo viền cyan, huy hiệu mã số thuế hợp lệ) + tab neo; trái = thống kê, ca cần người trong tuần (số ca theo ngày từ slots tin đang mở), tin đang tuyển, ứng viên phù hợp, lịch phỏng vấn; phải = hồ sơ công ty (danh sách trường còn thiếu), hoạt động gần đây, thẻ đăng ca mới. Trang con tự nhận tối qua `.jd-root`/`theme-abyss`; hộp thoại dùng `theme-ivory` riêng nên vẫn sáng.
- Tổng quan `/tim-viec`: thẻ hồ sơ + LightCurves, tab neo, 2 cột 2fr/1fr, chỉ dữ liệu thật (không % kỹ năng). Code: `pages/jobseeker/Dashboard.tsx`, `overview/parts.tsx`.

### Khu quản lý (dashboard) — chủ dự án 2026-11-16
- Nền khung: **nâu xám ấm `wm-dune` #CFC4B2** (`.dash-bg` trên DashboardShell) để sidebar kính và thẻ nổi rõ. Biến `--page-*` vẫn theo theme kem.
- Sidebar: kính kem sáng nổi (`.sb-glass`, components/layout/sidebar). Thẻ nội dung cùng kiểu: **`.dash-card`** (kính kem 62%, nhòe 24px,
  viền 10% than chì, ánh sáng mép trên, bóng mềm, bo 24px) — Panel, StatCard, EmptyState dùng sẵn; thẻ tự dựng `rounded-card bg-page-surface`
  cấp ngoài cùng trong `<main>` tự nhận kiểu này (thẻ lồng bên trong thì không). Chữ than chì trên thẻ ≈ 14:1; chữ phụ trên nền dune ≈ 5:1.
- Không có chế độ tối cho khu quản lý (chủ dự án bỏ công tắc).

### Chữ (2026-11-12)
Cỡ nhỏ nhất 13px (`text-xs` đã đổi), chữ phụ ≥ 14px (`text-sm`), nội dung 16px; nội dung line-height 1.6, tiêu đề 1.2
(display 1.15–1.2). Phân cấp bằng cỡ + độ đậm, không làm mờ màu. Số liệu (lương/giờ, km, giờ ca) `tnum` + đậm hơn chữ quanh.
Font giữ Plus Jakarta Sans (tiêu đề) + Inter (nội dung).

Hạt màu chỉ hiện trên nền tối (intro, banner, section night/than chì/graphite); trên nền sáng hạt trở về đơn sắc theo màu chữ trang.

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

- **Plus Jakarta Sans** cho display và tiêu đề thẻ; **Inter** cho nội dung (cả hai có bộ chữ tiếng Việt). Chỉ hai họ chữ, tải từ Google Fonts trong `index.html` với độ đậm 400–700 (Playfair Display đã gỡ 2026-11-20, không còn `font-serif`). Không dùng nhãn in hoa (`uppercase`) hay giãn chữ rộng; nhãn nhỏ là `text-sm font-medium text-page-muted`.
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

Không dùng bóng đổ trên trang công khai (trừ thẻ trên nền sáng ở giai đoạn 2, xem Hai nền). Chiều sâu đến từ:
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
- **Chuyển động**: `Reveal` (hiện khi cuộn tới, một lần), `TextReveal` (chữ trồi theo từ, một lần), `RollText` (chữ cuộn khi hover — cha phải có class `group`), `Magnetic` (nút hút theo chuột), `CustomCursor`.
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
  **Ngoại lệ thứ hai (2026-11-07, đổi 2026-11-15, chủ dự án duyệt):** Đăng nhập / Đăng ký / Quên mật khẩu
  (`pages/public/auth/*`) theo bố cục `references/p11.mp4` — một thẻ kính **tối** `.glass-dark` chia hai nửa, toàn trang nền
  `wm-night` #0A0F0D + hạt bụi `DustField` (thay các phiến hình học sáng cũ); được phép: kính mờ, vệt sáng rất nhẹ theo chuột,
  làm nhòe ngắn (`filter: blur`) lúc hai nửa đổi chỗ. Có nền đặc dự phòng khi không có backdrop-filter / `prefers-reduced-transparency`.
  Mọi hiệu ứng có nhánh giảm chuyển động.
  **Ngoại lệ thứ ba (2026-11-08, chủ dự án duyệt):** trang Việc làm `/viec-lam`, bản cuộn
  (`components/discover/ScrollGallery.tsx` bố cục `jobs`, `pages/public/jobs/JobSearchBar.tsx`). Được phép:
  - **Kính mờ** `.glass-liquid` (kèm bóng mềm của nó) cho: ô tìm kiếm đầu trang, viên thu gọn dính dưới
    header, thanh tìm kiếm nổi khi bấm viên (kính đậm hơn `backdrop-blur-xl`, chip chưa chọn cũng có nền kính),
    và chồng thẻ nội dung cột phải. Thẻ ở giữa hiện chữ; thẻ trên/dưới là khung kính trống, nghiêng theo ảnh;
    thẻ cao ≈80% ảnh để ảnh luôn là khối lớn nhất.
  - **Vệt sáng màu ảnh** dưới ảnh đang xem: bản ảnh 160px làm nhòe mạnh (`blur-[56px]`), đặt sau ảnh,
    chỉ đổi opacity theo cuộn (tối đa 0.55). Màu đến từ chính ảnh, không thêm token màu nào.
  **Ngoại lệ thứ tư (2026-11-13) ĐÃ HỦY (2026-11-22, chủ dự án):** trang Đăng tin `/dang-tin` (`pages/public/PostJobPage.tsx`)
  không còn thẻ kính, nền loang; dùng nền ban ngày và bố cục như `/ho-so`. Phần mô tả dưới đây về `/dang-tin` chỉ còn giá trị lịch sử.
  Giới hạn: không mang các hiệu ứng này sang trang công khai khác khi chưa hỏi; bản giảm chuyển động
  (`StaticGallery`) không có vệt sáng. Ô tìm kiếm ở các trang khác vẫn theo mục **Thanh tìm kiếm** ở trên.
  **Ngoại lệ thứ năm (2026-11-15, đổi cùng ngày, chủ dự án yêu cầu):** form bắt đầu của nhà tuyển dụng `/tuyen-dung/bat-dau` (`pages/recruiter/onboarding/*`) theo trang Đăng ký: nền `wm-night` + hạt bụi, một thẻ kính tối `.glass-dark`; chữ, ô nhập, nút, cảnh báo dùng biến `page-*`/`accent`/`danger` nên tự đúng màu trên nền tối (`TaxCodeField` dùng chung với khung Xác minh sáng không cần thêm prop). Không glow; có phương án đặc; chuyển bước chỉ opacity/transform, có nhánh giảm chuyển động.
  **Đăng nhập / Đăng ký / Quên mật khẩu (2026-11-20):** nền đổi sang nền hero trang chủ (ảnh tia sáng xanh + cam đáy, tia sáng "thở"), nền phủ thêm `abyss` 55% + cam 60% cho trầm hơn trang chủ, thẻ kính tối thêm lớp `abyss` 65%; nửa chào mừng là tấm sáng hơn `.auth-welcome-panel` (xanh biển + tia xanh ngọc + ánh cam đáy), trượt sang nửa kia khi đổi chế độ — thay nền `wm-night` + hạt bụi của ngoại lệ thứ hai.
  **Ngoại lệ thứ sáu (2026-11-19, chủ dự án duyệt):** toàn bộ **trang chủ** dùng nền xanh có ảnh, glow, kính mờ (trắng và tối),
  dải màu chuyển cam–đào và bóng mềm cho thẻ — xem mục **Trang chủ nền xanh**. Không mang sang trang khác khi chưa hỏi.
- Dùng `#000` / `#fff` tuyệt đối (nền tối là `#0A0F0D`, nền sáng `#FAF4EA`).
- Viết hex trực tiếp trong component — thêm vào `tokens.json` nếu thật sự cần màu mới.
- Đánh số 01/02/03 cho nội dung không phải trình tự thật.
- Đưa hiệu ứng cuộn/con trỏ tùy biến vào dashboard.

## Known gaps & assumptions

- **[giả định]** Thang `title/body/body-sm` ghi theo cách code đang dùng class Tailwind mặc định; chưa có token riêng.
- **[giả định]** Trạng thái lỗi/thành công của form chưa được thiết kế cho bảng màu này (không có đỏ/xanh). Khi cần, ưu tiên biểu tượng + chữ thay vì chỉ màu, và hỏi chủ dự án trước khi thêm màu ngữ nghĩa.
- Skill `frontend-design` liệt kê “nền kem gần #F4F1EA” và “nhãn in hoa phía trên mọi tiêu đề” là dấu hiệu giao diện do AI tạo. Ivory `#FAF4EA` và `.eyebrow` là lựa chọn có chủ đích của chủ dự án — giữ nguyên ở các trang khác, nhưng dùng eyebrow tiết chế ở trang mới. **Trang chủ đã bỏ eyebrow trên tiêu đề section (2026-11-20).**
- `HeroCanvas.tsx` (shader nền intro cũ) đã xóa 2026-11-21 (không còn dùng từ 2026-11-19).

## Hồ sơ người tìm việc (2026-11-21)
- **Một trình sửa:** `/ho-so` (`pages/public/ProfilePage.tsx` + `profile/*`). `/tim-viec/ho-so` chỉ chuyển hướng về `/ho-so` và giữ `#neo` (`thong-tin`, `kinh-nghiem`, `lich-ranh`, thêm `ky-nang`, `mong-muon`, `ve-ban`). Mỗi nhóm có `scroll-mt-28`.
- **Một công tắc công khai:** `hooks/usePublicProfile` (`isPublic = published && visibility === 'public'`); bật ghi cả hai, tắt đặt `published=false` + `visibility='connected'`. Dùng ở dải trạng thái đầu `/ho-so`, Cài đặt và bước 3 của form bắt đầu. Dải đầu trang giữ MỘT `BTN_ACCENT`.
- **Bố cục:** không còn số 01–07. Mục lục dính (từ lg) + biểu mẫu + xem trước (từ xl; dưới xl xem trước nằm dưới biểu mẫu). Chấm mục lục lấy từ cùng danh sách tiêu chí với %.
- **Thời gian kinh nghiệm:** hai ô `type="month"` (Từ, Đến) + "Đang làm ở đây". Lưu chuỗi `MM/YYYY – MM/YYYY` hoặc `MM/YYYY – nay`; giá trị cũ ("2024 – 2025") tự đổi khi mở.
- **Form bắt đầu người tìm việc:** `/tim-viec/bat-dau` (3 bước, ai cũng bỏ qua được), chỉ tự vào sau khi xác nhận email lúc đăng ký.
