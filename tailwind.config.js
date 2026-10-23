import plugin from 'tailwindcss/plugin'
// Bảng màu Workmate — nguồn duy nhất, xem src/styles/tokens.json và DESIGN.md
import tokens from './src/styles/tokens.json'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        match: {
          high:   '#22c55e',
          medium: '#f59e0b',
          low:    '#ef4444',
        },
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
        // CŨ — chỉ còn trong các component trang chủ không dùng nữa. Không dùng cho code mới.
        ink: {
          900: '#08090a',
          800: '#121315',
          700: '#1c1e21',
          600: '#2a2d31',
          400: '#6b7075',
          200: '#b9bdc2',
          100: '#e8eaec',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['"Instrument Sans"', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        // Chữ lớn theo viewport cho các "màn" statement.
        // line-height nới rộng hơn mức thường thấy để dấu tiếng Việt
        // (ố, ạ, ẫ…) không bị cắt khi chữ phóng to.
        'display-sm': ['clamp(2rem, 4.5vw, 3.25rem)', { lineHeight: '1.12', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(2.5rem, 6vw, 4.5rem)',  { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.75rem, 7vw, 5.5rem)', { lineHeight: '1.06', letterSpacing: '-0.03em' }],
      },
      spacing: {
        section:    'clamp(5rem, 12vw, 11rem)',
        'section-sm': 'clamp(3.5rem, 8vw, 7rem)',
      },
      // Bo góc theo vai trò — xem DESIGN.md mục Shapes. Viên thuốc dùng rounded-full.
      borderRadius: {
        control: '0.5rem', // link/nút nhỏ trong header, menu
        card: '1rem',      // thẻ, thanh tìm kiếm
      },
      screens: {
        xs: '475px',
      },
      keyframes: {
        'logo-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'logo-in': 'logo-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [
    // Xuất bảng màu thành biến CSS (--wm-charcoal…) để CSS thuần dùng chung một nguồn
    plugin(({ addBase }) => {
      addBase({
        ':root': Object.fromEntries(
          Object.entries(tokens.palette).map(([name, hex]) => [`--wm-${name}`, hex]),
        ),
      })
    }),
  ],
}
