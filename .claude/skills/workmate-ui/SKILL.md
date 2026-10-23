---
name: workmate-ui
description: Build or change Workmate UI in the project's established style — warm-neutral monochrome palette, editorial typography, scroll-driven section color transitions, GSAP/Lenis motion on public pages. Use for any task that adds or edits a page, section or component in this repo, before writing JSX or Tailwind classes.
---

# Workmate UI

Phong cách đã được chủ dự án chọn và chốt. Skill này để **tiếp tục** phong cách đó, không
thiết kế lại. Nguồn chuẩn: `DESIGN.md` (token, quy tắc) và `prj-context.md` (nghiệp vụ,
trạng thái tính năng). Đọc mục liên quan trong hai file đó trước khi code.

Thứ tự ưu tiên khi các nguồn khác nhau: yêu cầu của người dùng > `DESIGN.md` > skill này >
`frontend-design` / `ui-ux-pro-max` (chỉ để tham khảo, không ghi đè DESIGN.md).

## Trước khi viết code

1. Xác định trang thuộc **khu công khai** (được dùng chuyển động) hay **dashboard**
   (yên tĩnh: không cuộn-scrub, không con trỏ tùy biến, không Magnetic).
2. Tìm component có sẵn trong `src/components/motion`, `components/home`, `components/layout`
   trước khi viết mới.
3. Nội dung giả đặt trong file dữ liệu (trang chủ: `components/home/content.ts`), ghi rõ là mẫu.

## Màu

- Component trang chủ dùng `bg-page-bg text-page-fg text-page-muted border-page-line
  bg-page-surface border-page-edge` — tự khớp mọi section.
- Phần luôn một màu cố định: `wm-*` (Tailwind) hoặc `THEMES` (TS). Không viết hex trong component.
- Màu mới → thêm vào `src/styles/tokens.json`, tính tương phản (chữ ≥ 4.5:1, viền ô nhập ≥ 3:1), cập nhật `DESIGN.md`.
- Không: màu bão hòa, gradient màu, glow, bóng đổ, `#000`/`#fff`, modifier `/opacity` trên `page-*`.

## Thêm một section vào trang chủ

```tsx
<section data-theme="stone" className="shell py-section">   {/* theme: charcoal|ivory|stone|sage|graphite */}
  <p className="eyebrow text-page-muted"><span className="w-8 h-px bg-page-line" />Nhãn</p>
  <TextReveal text="Tiêu đề ngắn, có quan điểm." className="font-display text-display-md font-semibold text-page-fg mt-8 max-w-[16ch]" />
</section>
```

- `useSectionThemes` tự nhận `data-theme`; hai section liền nhau cùng theme thì không có chuyển màu.
- Tùy chỉnh đoạn chuyển màu: `data-theme-start` / `data-theme-end` (mặc định `top 75%` → `top 25%`).
- Đặt section vào `HomePage.tsx` và cập nhật bảng section trong comment đầu file + `prj-context.md` mục 5.

## Chuyển động theo cuộn (đảo ngược được)

```tsx
const ref = useRef<HTMLElement>(null)
const reduced = useReducedMotion()
useGSAP(() => {
  if (reduced) return                       // tắt chuyển động → hiện trạng thái cuối
  gsap.fromTo('[data-word]', { yPercent: 120, opacity: 0 }, {
    yPercent: 0, opacity: 1, stagger: 0.03, ease: 'power3.out',
    scrollTrigger: { trigger: ref.current, start: 'top 80%', end: 'top 40%', scrub: 0.6 },
  })
}, { scope: ref, dependencies: [reduced] })
```

- Import GSAP **chỉ** từ `@utils/gsap`. Chữ cần tách từ: dùng `MaskedWords`.
- Tween bắt đầu giữa một timeline có ScrollTrigger: đặt trạng thái đầu bằng `gsap.set()`
  bên ngoài timeline, trong timeline dùng `.to()` (fromTo sẽ mất trạng thái đầu khi refresh).
- Selector chuỗi trong `useGSAP` bị giới hạn trong `scope`; phần tử ngoài scope (header) phải `document.querySelector`.
- Chỉ animate `transform`/`opacity`. Một lần “hiện khi cuộn tới”: dùng `Reveal` / `TextReveal`.

## Tương tác

- Nút chính: `bg-page-fg text-page-bg rounded-full px-8 py-4 text-sm font-medium` + `group`
  + `<RollText>`; có thể bọc `<Magnetic>` (chỉ khu công khai).
- Thẻ có thể bấm: thêm `data-cursor="Nhãn"` để con trỏ hiện nhãn.
- Bo góc: `rounded-full` (nút, tag), `rounded-card` (thẻ, ô tìm kiếm), `rounded-control` (link nhỏ).
- Mọi chức năng phải dùng được bằng bàn phím và không cần hover.

## Kiểm tra trước khi báo xong

1. `npx tsc --noEmit -p .` và `npx eslint src` không có lỗi mới; `npm run build` chạy được.
2. Mở `npx vite --port 5173`, chụp màn hình ở 1440, 768 và 390px; không tràn ngang.
3. Cuộn xuôi rồi ngược qua phần vừa sửa. Lenis giữ đích cuộn riêng nên `window.scrollTo`
   có thể bị kéo lại — dùng `(await import('/src/hooks/useSmoothScroll.ts')).scrollToY(y)`.
4. Đã sửa `tailwind.config.js` thì khởi động lại dev server.
5. Chỉ nói “đã kiểm tra bằng screenshot” khi thật sự đã chụp.
