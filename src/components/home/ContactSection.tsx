import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import Magnetic from '@components/motion/Magnetic'
import RollText from '@components/motion/RollText'

const EMAIL = 'support@workmate.vn'

type CopyState = 'idle' | 'copied' | 'failed'

/** Liên hệ cuối trang: tiêu đề lớn, hai lối đăng ký, email kèm nút sao chép. */
export default function ContactSection() {
  const [copy, setCopy] = useState<CopyState>('idle')
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopy('copied')
    } catch {
      // Clipboard bị chặn (http thường, quyền trình duyệt) — báo để người dùng tự chép
      setCopy('failed')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopy('idle'), 2000)
  }

  return (
    <section className="shell py-section border-t border-ink-700">
      <Reveal y={16}>
        <p className="eyebrow text-ink-400">
          <span className="w-8 h-px bg-ink-600" />
          Liên hệ
        </p>
      </Reveal>

      <TextReveal
        text="Cùng tìm đúng người cho đúng việc."
        className="font-display text-display-lg font-semibold text-white mt-8 max-w-[16ch]"
      />

      <div className="grid md:grid-cols-12 gap-14 md:gap-8 mt-20">
        {/* Hai lối đăng ký */}
        <div className="md:col-span-6 space-y-10">
          {[
            { q: 'Bạn đang tìm việc?', label: 'Tạo hồ sơ miễn phí', href: '/dang-ky', primary: true },
            { q: 'Bạn cần tuyển người?', label: 'Đăng tin tuyển dụng', href: '/dang-ky?role=recruiter', primary: false },
          ].map((item, i) => (
            <Reveal key={item.href} delay={0.1 + i * 0.1}>
              <p className="text-sm text-ink-400 mb-4">{item.q}</p>
              <Magnetic>
                <Link
                  to={item.href}
                  className={
                    item.primary
                      ? 'group inline-flex items-center gap-2 bg-white text-ink-900 font-medium text-sm px-8 py-4 rounded-full hover:bg-ink-100 transition-colors duration-300'
                      : 'group inline-flex items-center gap-2 border border-ink-600 text-white font-medium text-sm px-8 py-4 rounded-full hover:border-ink-200 transition-colors duration-300'
                  }
                >
                  <RollText>{item.label}</RollText>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Magnetic>
            </Reveal>
          ))}
        </div>

        {/* Email */}
        <Reveal delay={0.3} className="md:col-span-6">
          <p className="text-sm text-ink-400 mb-4">Hoặc viết cho chúng tôi</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={`mailto:${EMAIL}`}
              className="group font-display text-display-sm font-semibold text-white break-all"
            >
              <RollText>{EMAIL}</RollText>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em]
                         text-ink-400 hover:text-white border border-ink-600 hover:border-ink-200
                         rounded-full px-4 py-2 transition-colors duration-300"
            >
              {copy === 'copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copy === 'copied' ? 'Đã sao chép' : copy === 'failed' ? 'Không sao chép được' : 'Sao chép'}
            </button>
          </div>

          {/* Báo cho trình đọc màn hình khi sao chép xong */}
          <p className="sr-only" aria-live="polite">
            {copy === 'copied' ? 'Đã sao chép địa chỉ email' : copy === 'failed' ? 'Không sao chép được, hãy chép thủ công' : ''}
          </p>

          <p className="text-sm text-ink-400 mt-8 max-w-sm leading-relaxed">
            Thắc mắc về tài khoản, hợp tác tuyển dụng hay góp ý cho sản phẩm.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
