import plugin from 'tailwindcss/plugin'
// Bảng màu Workmate — nguồn duy nhất, xem src/styles/tokens.json và DESIGN.md
import tokens from './src/styles/tokens.json'

/** Màu từ biến CSS nhưng vẫn dùng được modifier /opacity (vd. border-danger/30) */
const varWithAlpha = (name) => ({ opacityValue }) =>
  opacityValue === undefined || String(opacityValue).includes('var(') ? `var(${name})` : `color-mix(in srgb, var(${name}) ${Number(opacityValue) * 100}%, transparent)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bảng màu trung tính ấm của Workmate (wm-charcoal, wm-ivory…)
        wm: tokens.palette,
        // Màu trang chủ theo section đang xem — giá trị do useSectionThemes nội suy
        // khi cuộn (xem index.css). Không dùng được modifier /opacity với các màu này.
        page: {
          bg:    'var(--page-bg)',
          fg:    'var(--page-fg)',
          muted: 'var(--page-muted)',
          line:  'var(--page-line)',
          surface: 'var(--page-surface)',
          edge:  'var(--page-edge)',
        },
        // Màu trạng thái cố định (tokens.json → semantic). *-soft: nền nhạt pha với nền trang
        // danger / warning-ink đổi theo bề mặt (nền tối dùng bản sáng hơn: --danger, --warning-ink); có hỗ trợ /opacity
        warning: tokens.palette[tokens.semantic.warning],
        danger: varWithAlpha('--danger'),
        'warning-ink': varWithAlpha('--warning-ink'),
        // Màu nhấn theo vai trò (tokens.json → roles, biến CSS đặt ở plugin dưới). Không dùng modifier /opacity.
        accent: {
          DEFAULT: 'var(--accent)',
          fg: 'var(--accent-fg)',
          ink: 'var(--accent-ink)',
          soft: 'color-mix(in srgb, var(--accent) 8%, var(--page-bg))', // 8%: chữ accent-ink trên nền này ≥ 4.5:1 (đã đo)
        },
        'warning-soft': 'color-mix(in srgb, var(--wm-amber) 14%, var(--page-bg))',
        'danger-soft':  'color-mix(in srgb, var(--danger) 12%, var(--page-bg))',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        // Chữ lớn theo viewport cho các "màn" statement.
        // line-height nới rộng hơn mức thường thấy để dấu tiếng Việt
        // (ố, ạ, ẫ…) không bị cắt khi chữ phóng to.
        'display-sm': ['clamp(2rem, 4.5vw, 3.25rem)', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(2.5rem, 6vw, 4.5rem)',  { lineHeight: '1.18', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.75rem, 7vw, 5.5rem)', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
        // Cỡ nhỏ nhất của site = 13px (tag, nhãn, chú thích). Trước 11/2026 là 12px mặc định Tailwind.
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      spacing: {
        section:    'clamp(5rem, 12vw, 11rem)',
        'section-sm': 'clamp(3.5rem, 8vw, 7rem)',
      },
      // Bo góc theo vai trò — xem DESIGN.md mục Shapes. Viên thuốc dùng rounded-full.
      borderRadius: {
        control: '0.5rem', // 8px — link/nút nhỏ trong header, menu, ô nhập
        md: '0.875rem',    // 14px — khối vừa (panel, popup nhỏ)
        card: '1rem',      // 16px — thẻ, thanh tìm kiếm
        lg: '1.25rem',     // 20px — modal, khối lớn
      },
      screens: {
        xs: '475px',
      },
      keyframes: {
        'logo-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'none' },
        },
        // Icon vừa bật trạng thái (lưu, thích, đã gửi) nảy nhẹ một lần — utils/feedback.ts → POP
        pop: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'logo-in': 'logo-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        pop: 'pop 300ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      // Ba mức thời lượng của cả site (DESIGN.md → Motion). Không dùng số lẻ khác ngoài trang chủ.
      transitionDuration: {
        fast: '150ms', // bấm, hover, đổi màu
        base: '300ms', // mở/đóng, đổi trạng thái, trượt
        slow: '500ms', // nội dung hiện ra khi cuộn tới
      },
    },
  },
  plugins: [
    // Xuất bảng màu thành biến CSS (--wm-charcoal…) để CSS thuần dùng chung một nguồn
    plugin(({ addBase }) => {
      const roleVars = (role) =>
        Object.fromEntries(Object.entries(role).map(([k, ref]) => [`--${k}`, tokens.palette[ref]]))
      addBase({
        ':root': {
          ...Object.fromEntries(Object.entries(tokens.palette).map(([name, hex]) => [`--wm-${name}`, hex])),
          ...roleVars(tokens.roles.default),
          // Trạng thái theo bề mặt: nền sáng dùng bản đậm, nền tối (.surface-dark…) dùng bản sáng
          '--danger': tokens.palette.rust,
          '--warning-ink': tokens.palette['amber-ink'],
        },
        // Người tìm việc: màu nhấn xanh lá (data-role đặt trên <html> theo tài khoản đang đăng nhập)
        '[data-role="seeker"]': roleVars(tokens.roles.seeker),
      })
    }),
  ],
}
