import { useState, type Ref } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Send } from 'lucide-react'

import RollText from '@components/motion/RollText'
import { cn } from '@utils/cn'

type Props = {
  /** Gắn vào ô từ khóa (hero dùng cho focusSearch). */
  inputRef?: Ref<HTMLInputElement>
  /** `md`: cỡ ở hero; `sm`: gọn hơn (lời kết cuối trang). */
  size?: 'md' | 'sm'
  className?: string
}

/**
 * Ô tìm việc dạng viên thuốc kính (từ khóa + địa điểm) dùng ở hero và lời kết.
 * Gửi form → /viec-lam?keyword=…&city=… (cùng tham số ở mọi nơi). Nhãn ô nhập là sr-only
 * bọc trong <label> nên không cần id (nhiều form trên một trang vẫn không trùng).
 */
export default function HomeSearchForm({ inputRef, size = 'md', className }: Props) {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()
  const sm = size === 'sm'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (location) params.set('city', location)
    navigate(`/viec-lam?${params.toString()}`)
  }

  const pad = sm ? 'px-4 py-2.5' : 'px-5 py-3.5'

  return (
    <form
      onSubmit={handleSearch}
      role="search"
      className={cn(
        `flex flex-col sm:flex-row sm:items-center p-1.5 rounded-card sm:rounded-full
         border border-wm-cyan/40 bg-wm-abyss/45 backdrop-blur-xl backdrop-saturate-150
         shadow-[inset_0_1px_0_color-mix(in_srgb,var(--wm-ivory)_30%,transparent),0_0_32px_-6px_color-mix(in_srgb,var(--wm-cyan)_40%,transparent)]
         transition-[transform,border-color,box-shadow] duration-300
         hover:border-wm-cyan/70 hover:-translate-y-0.5 motion-reduce:transform-none
         focus-within:border-wm-cyan focus-within:ring-2 focus-within:ring-wm-cyan/50`,
        className,
      )}
    >
      <label className={cn('flex-1 flex items-center gap-3 min-h-11', pad)}>
        <Search className="w-4 h-4 text-wm-ivory shrink-0" aria-hidden="true" />
        <span className="sr-only">Từ khóa tìm việc</span>
        <input
          ref={inputRef}
          type="search"
          name="keyword"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Vị trí, kỹ năng, ngành nghề…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 min-w-0 bg-transparent !outline-none text-base text-wm-ivory placeholder:text-wm-ivory/80"
        />
      </label>

      <label
        className={cn(
          'flex items-center gap-3 min-h-11 border-t border-wm-ivory/25 sm:border-t-0 sm:border-l',
          pad,
          sm ? 'sm:w-44' : 'sm:w-56',
        )}
      >
        <MapPin className="w-4 h-4 text-wm-ivory shrink-0" aria-hidden="true" />
        <span className="sr-only">Địa điểm</span>
        <input
          type="text"
          name="city"
          autoComplete="address-level2"
          enterKeyHint="search"
          placeholder="Địa điểm…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 w-full min-w-0 bg-transparent !outline-none text-base text-wm-ivory placeholder:text-wm-ivory/80"
        />
      </label>

      <button
        type="submit"
        className={cn(
          `group mt-1.5 sm:mt-0 sm:ml-1.5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-wm-cyan text-wm-abyss font-semibold text-sm py-3
           hover:brightness-110 active:scale-[0.97] motion-reduce:active:scale-100
           transition-[filter,transform] duration-300
           focus-visible:!outline-wm-ivory focus-visible:!outline-offset-2`,
          sm ? 'px-6' : 'px-8',
        )}
      >
        <Send className="h-4 w-4" aria-hidden />
        <RollText>Tìm việc</RollText>
      </button>
    </form>
  )
}
