import { useEffect, useId, useRef } from 'react'
import { useExperienceStore } from '@context/experienceStore'

export default function EffectsPreferenceDialog() {
  const { hasChosenQuality, setQuality } = useExperienceStore()
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useId()
  const description = useId()

  useEffect(() => {
    const element = dialog.current
    if (hasChosenQuality || !element) return
    element.showModal()
    return () => element.close()
  }, [hasChosenQuality])

  if (hasChosenQuality) return null

  return (
    <dialog
      ref={dialog}
      aria-labelledby={title}
      aria-describedby={description}
      onCancel={(event) => {
        event.preventDefault()
        setQuality('low')
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-card border border-wm-ivory/20 bg-wm-night p-6 text-wm-ivory shadow-xl backdrop:bg-black/65"
    >
      <h2 id={title} className="text-xl font-semibold">Chọn mức hiệu ứng</h2>
      <p id={description} className="mt-2 text-sm">
        Chọn Thấp để cuộn nhẹ hơn trên máy yếu, hoặc Cao để xem đầy đủ hiệu ứng. Bạn có thể đổi trong menu trên header.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" autoFocus className="rounded-control bg-wm-ivory px-4 py-2 font-semibold text-wm-night" onClick={() => setQuality('low')}>
          Thấp
        </button>
        <button type="button" className="rounded-control border border-wm-ivory/40 px-4 py-2 font-semibold" onClick={() => setQuality('high')}>
          Cao
        </button>
      </div>
    </dialog>
  )
}
