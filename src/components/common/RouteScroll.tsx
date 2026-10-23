import { useLayoutEffect, useState, type RefObject } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

type Props = {
  /** Vùng cuộn riêng (vd. `<main>` của dashboard). Bỏ trống = cuộn cả cửa sổ. */
  container?: RefObject<HTMLElement>
}

const STORAGE_KEY = 'wm:scroll-positions'

/** Vị trí cuộn theo từng mục lịch sử, giữ qua cả lần tải lại trang. */
const positions = new Map<string, number>(readStored())

function readStored(): [string, number][] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

if (typeof window !== 'undefined') {
  // Tự xử lý thay cho trình duyệt — mặc định nó khôi phục trước khi trang kịp render
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

  window.addEventListener('pagehide', () => {
    try {
      // Giữ 50 mục gần nhất cho gọn
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...positions].slice(-50)))
    } catch {
      /* chế độ riêng tư chặn sessionStorage — bỏ qua */
    }
  })
}

/**
 * Đặt vị trí cuộn khi vào một trang: điều hướng mới → lên đầu trang,
 * Back/Forward → trở lại chỗ cũ, có `#hash` → cuộn tới phần tử đó.
 *
 * Chỉ chạy lúc mount, nên nơi dùng phải remount nó mỗi lần đổi trang
 * (đặt trong khối có `key` theo route). Lý do: khi AnimatePresence giữ
 * trang cũ lại để fade-out, bản cũ vẫn nhận location mới — nếu chạy theo
 * location, trang cũ sẽ nhảy lên đầu ngay trước mắt người dùng.
 */
export default function RouteScroll({ container }: Props) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [entry] = useState(() => ({
    // Mọi lần tải trang mới đều có key "default" — thêm pathname để mở "/" không
    // nhận nhầm vị trí cuộn đã lưu của một trang khác cũng được tải mới trước đó.
    key: location.key === 'default' ? `default:${location.pathname}` : location.key,
    hash: location.hash,
    restore: navigationType === 'POP',
  }))

  useLayoutEffect(() => {
    const el = container?.current
    const target: HTMLElement | Window = el ?? window
    const read = () => (el ? el.scrollTop : window.scrollY)

    const anchor = entry.hash && document.getElementById(decodeURIComponent(entry.hash.slice(1)))
    if (anchor) anchor.scrollIntoView()
    else target.scrollTo(0, entry.restore ? (positions.get(entry.key) ?? 0) : 0)

    // Chỉ ghi khi mục lịch sử hiện tại vẫn là trang này — tránh ghi đè vị trí
    // bằng giá trị bị trình duyệt kẹp lại lúc trang đang được thay.
    const save = () => {
      const current = history.state?.key ?? `default:${window.location.pathname}`
      if (current === entry.key) positions.set(entry.key, read())
    }
    target.addEventListener('scroll', save, { passive: true })
    return () => target.removeEventListener('scroll', save)
  }, [container, entry])

  return null
}
