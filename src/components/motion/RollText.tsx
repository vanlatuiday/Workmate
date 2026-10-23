type Props = {
  children: string
  className?: string
}

/**
 * Chữ cuộn lên khi hover: bản chính trượt lên khỏi khung, bản sao từ dưới
 * trồi lên thế chỗ. Phần tử cha phải có class `group`.
 *
 * py/-my: nới khung cắt để dấu tiếng Việt (ấ, ỗ…) không bị cụt, mà không
 * làm thay đổi chiều cao dòng.
 *
 * inline-flex chứ không phải inline-block: inline-block có overflow-hidden lấy
 * mép dưới làm baseline, làm lệch chữ khi cha canh theo baseline (vd. số 01–04
 * trong menu). Flex container vẫn lấy baseline của dòng chữ bên trong.
 */
export default function RollText({ children, className }: Props) {
  return (
    <span className={`relative inline-flex overflow-hidden -my-[0.2em] ${className ?? ''}`}>
      <span
        className="block py-[0.2em] transition-transform duration-500 ease-editorial
                   group-hover:-translate-y-full group-focus-visible:-translate-y-full"
      >
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block py-[0.2em] translate-y-full transition-transform duration-500 ease-editorial
                   group-hover:translate-y-0 group-focus-visible:translate-y-0"
      >
        {children}
      </span>
    </span>
  )
}
