import { Link } from 'react-router-dom'
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import Magnetic from '@components/motion/Magnetic'
import RollText from '@components/motion/RollText'

type Props = {
  /** Đưa người dùng về thanh tìm kiếm ở hero. */
  onFindJob: () => void
}

/** Section F — lời kết và lối quay lại tính năng tìm việc. Footer nằm ngay sau. */
export default function ClosingSection({ onFindJob }: Props) {
  return (
    <section data-theme="charcoal" className="shell py-section">
      <Reveal y={16}>
        <p className="eyebrow text-page-muted">
          <span className="w-8 h-px bg-page-line" />
          Bắt đầu
        </p>
      </Reveal>

      <TextReveal
        text="Việc tiếp theo của bạn bắt đầu từ đây."
        className="font-display text-display-lg font-semibold text-page-fg mt-8 max-w-[15ch]"
      />

      <Reveal delay={0.25} className="flex flex-col sm:flex-row sm:items-center gap-3 mt-14">
        <Magnetic>
          <button
            type="button"
            onClick={onFindJob}
            className="group inline-flex items-center gap-2 bg-page-fg text-page-bg font-medium text-sm
                       px-8 py-4 rounded-full transition-opacity duration-300 hover:opacity-90"
          >
            <RollText>Tìm việc ngay</RollText>
            <ArrowUp className="w-4 h-4" />
          </button>
        </Magnetic>
        <Magnetic>
          <Link
            to="/dang-ky?role=recruiter"
            className="group inline-flex items-center gap-2 border border-page-line text-page-fg font-medium text-sm
                       px-8 py-4 rounded-full hover:border-page-fg transition-colors duration-300"
          >
            <RollText>Tôi cần tuyển người</RollText>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Magnetic>
      </Reveal>
    </section>
  )
}
