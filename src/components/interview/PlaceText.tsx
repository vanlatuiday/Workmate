import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'

// Chỉ nhận http/https để chữ do doanh nghiệp nhập không thành link javascript: hay link lạ
const URL_RE = /(https?:\/\/[^\s]+)/g

// Dấu câu cuối không thuộc về link (vd. "…/abc." hoặc "(…/abc)")
const TRAILING_RE = /[.,;:!?)\]}'"]+$/

function Link({ url }: { url: string }) {
  const tail = url.match(TRAILING_RE)?.[0] ?? ''
  const href = url.slice(0, url.length - tail.length)
  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('break-all text-page-fg underline underline-offset-2', FOCUS)}
      >
        {href}
      </a>
      {tail}
    </>
  )
}

/** Địa điểm phỏng vấn: link họp (Meet, Zoom…) trong chữ được bấm mở ở tab mới. */
export default function PlaceText({ place }: { place: string }) {
  return (
    <>
      {place.split(URL_RE).map((part, i) =>
        i % 2 === 1 ? (
          <Link key={i} url={part} />
        ) : (
          part
        ),
      )}
    </>
  )
}
