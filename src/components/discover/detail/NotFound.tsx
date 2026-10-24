import BackLink from './BackLink'

/** Trạng thái "Không tìm thấy" dùng chung cho trang chi tiết. */
export default function DetailNotFound({ title, text }: { title: string; text: string }) {
  return (
    <section className="shell min-h-[60vh] py-section-sm">
      <BackLink />
      <h1 className="mt-10 font-display text-display-sm font-semibold">{title}</h1>
      <p className="mt-4 max-w-xl text-page-muted">{text}</p>
    </section>
  )
}
