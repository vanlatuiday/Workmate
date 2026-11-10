import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'

// Chỉ nhận http/https để chữ do doanh nghiệp nhập không thành link javascript: hay link lạ
const URL_RE = /(https?:\/\/[^\s]+)/g

/** Địa điểm phỏng vấn: link họp (Meet, Zoom…) trong chữ được bấm mở ở tab mới. */
export default function PlaceText({ place }: { place: string }) {
  return (
    <>
      {place.split(URL_RE).map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('break-all text-page-fg underline underline-offset-2', FOCUS)}
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  )
}
