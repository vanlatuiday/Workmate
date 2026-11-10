import { Link } from "react-router-dom";

import { photoSrcSet, photoUrl } from "@components/discover/types";
import type { MatchJob } from "@pages/public/jobs/catalog";

/** Một việc thật được chọn để hiện trên ảnh thẻ, kèm nhãn nhỏ phía trên tên việc */
export type ChipJob = { job: MatchJob; tag: string };

/**
 * Ô kính nhỏ ở góc dưới ảnh: ảnh thu nhỏ + nhãn + tên việc (1 dòng) + lương.
 * Nền kính đặc hơn mặc định (alpha 90%) để chữ đọc rõ trên mọi ảnh. Bấm mở chi tiết việc.
 */
export default function FeatureJobChip({ item }: { item: ChipJob }) {
  const { job, tag } = item;
  return (
    <Link
      to={`/viec-lam/${job.id}`}
      data-cursor="Xem"
      className="glass-liquid group/chip absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-card p-2.5 text-page-fg outline-none [--glass-alpha:90%] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page-fg md:inset-x-auto md:bottom-4 md:right-4 md:w-72"
    >
      <img
        src={photoUrl(job.photo.id, 160)}
        srcSet={photoSrcSet(job.photo.id)}
        sizes="56px"
        alt=""
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        className="h-14 w-14 shrink-0 rounded-control object-cover"
      />
      <span className="min-w-0">
        <span className="block truncate text-xs text-page-muted">{tag}</span>
        <span className="block truncate text-sm font-medium group-hover/chip:underline">
          {job.title}
        </span>
        <span className="block truncate text-xs text-page-muted">
          {job.salaryLabel}
        </span>
      </span>
    </Link>
  );
}
