import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@utils/gsap'

/**
 * Bảng màu trung tính ấm, đơn sắc — không dùng màu nhấn bão hòa.
 * Tương phản đã kiểm tra: chữ chính ≥ 6.2:1, chữ phụ (--page-muted, 82%) ≥ 4.5:1
 * trên mọi nền; sage là nền khó nhất (4.52:1). Giữ khớp với `wm` trong tailwind.config.js.
 */
export const THEMES = {
  charcoal: { bg: '#242522', fg: '#F3F0E9' },
  ivory:    { bg: '#F3F0E9', fg: '#242522' },
  stone:    { bg: '#D9D3C8', fg: '#242522' },
  sage:     { bg: '#A6A69A', fg: '#242522' },
  graphite: { bg: '#454640', fg: '#F3F0E9' },
} as const

export type ThemeName = keyof typeof THEMES

/**
 * Đổi màu nền/chữ của cả trang theo section đang xem.
 *
 * Mỗi section khai báo `data-theme="stone"`. Ở mỗi chỗ giao giữa hai theme khác
 * nhau, màu nền được nội suy theo tiến trình cuộn — từ khi section mới chạm 75%
 * màn hình tới khi chạm 25% (tùy chỉnh bằng `data-theme-start` / `data-theme-end`).
 *
 * Màu chữ thì KHÔNG nội suy theo cuộn: nền sáng→tối và chữ tối→sáng đi ngược chiều
 * nhau, gặp nhau ở cùng một màu xám giữa chừng — chữ (và logo) biến mất. Chữ đổi
 * hẳn ở mốc 50% và chuyển mượt bằng CSS transition (@property --page-fg, index.css);
 * tại mốc đó chữ vẫn đạt ≥ 3:1 so với nền xám trung gian.
 *
 * Chỉ một listener ghi màu: trigger "tổng" tính tiến trình của mọi điểm giao từ
 * vị trí cuộn hiện tại rồi chọn điểm giao cuối cùng đã bắt đầu. Nếu để từng
 * trigger tự ghi, khi nhảy cóc lên đầu trang chúng sẽ ghi đè lẫn nhau và trang
 * dừng ở sai màu.
 */
export function useSectionThemes(scope: RefObject<HTMLElement>) {
  useGSAP(
    () => {
      const root = document.documentElement
      const sections = gsap.utils.toArray<HTMLElement>('[data-theme]', scope.current)
      if (!sections.length) return

      const names = sections.map((s) => s.dataset.theme as ThemeName)
      const boundaries = sections.flatMap((section, i) => {
        if (i === 0 || names[i] === names[i - 1]) return []
        const from = THEMES[names[i - 1]]
        const to = THEMES[names[i]]
        return [
          {
            st: ScrollTrigger.create({
              trigger: section,
              start: section.dataset.themeStart ?? 'top 75%',
              end: section.dataset.themeEnd ?? 'top 25%',
            }),
            bg: gsap.utils.interpolate(from.bg, to.bg),
            fromFg: from.fg,
            toFg: to.fg,
          },
        ]
      })

      let last = ''
      const apply = () => {
        // Tự tính từ scroll + start/end thay vì đọc st.progress: trigger không có
        // callback/animation thì ScrollTrigger chỉ cập nhật progress lúc refresh,
        // nên giá trị đó cũ ngay khi người dùng cuộn.
        const scroll = window.scrollY
        let bg: string = THEMES[names[0]].bg
        let fg: string = THEMES[names[0]].fg
        for (const b of boundaries) {
          const p = gsap.utils.clamp(0, 1, (scroll - b.st.start) / (b.st.end - b.st.start || 1))
          if (p > 0) {
            bg = b.bg(p)
            fg = p < 0.5 ? b.fromFg : b.toFg
          }
        }
        // Chỉ ghi khi đổi — mỗi lần ghi biến trên <html> là cả trang tính lại style
        if (bg + fg === last) return
        last = bg + fg
        root.style.setProperty('--page-bg', bg)
        root.style.setProperty('--page-fg', fg)
      }

      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: apply })
      // Sau khi refresh (đổi kích thước cửa sổ, font tải xong) start/end đã đổi
      // nên phải tính lại. Dùng sự kiện "refresh" toàn cục chứ không dùng onRefresh
      // của từng trigger: lúc onRefresh chạy, ScrollTrigger có thể vẫn đang tạm
      // dời vị trí cuộn để đo, đọc scrollY lúc đó sẽ ra sai màu và kẹt luôn.
      ScrollTrigger.addEventListener('refresh', apply)
      apply()

      return () => {
        ScrollTrigger.removeEventListener('refresh', apply)
        root.style.removeProperty('--page-bg')
        root.style.removeProperty('--page-fg')
      }
    },
    { scope },
  )
}
