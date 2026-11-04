import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { gsap, ScrollTrigger, useGSAP } from "@utils/gsap";
import { useReducedMotion } from "@hooks/useReducedMotion";
import { cn } from "@utils/cn";
import { photoSrcSet, photoUrl } from "@components/discover/types";
import TextReveal from "@components/motion/TextReveal";
import { EMPTY_FILTERS, filtersToParams } from "@pages/public/jobs/catalog";
import { homeMedia } from "./homeMedia";
import { homeSections, homeSectionsByRole } from "./content";
import { useHomeRole } from "./homeData";

/** Đích của nút trong từng khối */
const HREF: Record<string, string> = {
  schedule: "/ho-so",
  near: `/viec-lam?${filtersToParams({ ...EMPTY_FILTERS, nearMe: true })}`,
  match: "/match",
  guide: "/cam-nang",
};

/** Khối đang hiện, theo thứ tự. "guide" (cẩm nang) tạm ẩn theo ý chủ dự án —
 *  nội dung vẫn ở content.ts, thêm id vào đây là hiện lại. */
const SHOWN = ["schedule", "near", "match"];

/** Gạch đầu dòng ngắn cho cột "Workmate lo phần này", theo id khối (tóm từ block.body) */
const POINTS: Record<string, string[]> = {
  schedule: [
    "Khai lịch rảnh một lần",
    "Chỉ gợi ý ca nằm gọn trong lịch",
    "Đổi lịch là gợi ý đổi theo",
  ],
  near: [
    "Đặt bán kính đi làm",
    "Hiện khoảng cách từng việc",
    "Lọc việc gần nhà",
  ],
  match: [
    "Hai bên cùng quan tâm mới mở chat",
    "Không tin nhắn rác",
    "Hẹn phỏng vấn ngay trong chat",
  ],
  guide: [
    "Viết hồ sơ ngắn gọn",
    "Chuẩn bị cho ca đầu tiên",
    "Hiểu quyền lợi người làm linh hoạt",
  ],
  // Nhà tuyển dụng
  slots: [
    "Đăng tin kèm ca làm",
    "Chỉ gợi ý người rảnh đúng ca",
    "Không phải đọc từng hồ sơ",
  ],
  nearby: [
    "Xem ứng viên quanh cửa hàng",
    "Người ở gần đi làm đúng giờ",
    "Gắn bó lâu hơn",
  ],
};

/** Vị trí dính của hàng đầu (dưới header) và bước chồng giữa các hàng — dải thu gọn cao đúng bằng STEP */
const STICK_TOP = 96;
const STEP = 44;

type Block = {
  id: string;
  label: string;
  title: string;
  body: string;
  cta: string;
  href: string;
};

/** Một hàng của danh sách: ảnh trái, số + tên, mô tả + nút, cột "Workmate lo phần này" bên phải. Cả hàng bấm được (link kéo giãn). */
function BlockRow({
  block,
  index,
  sticky,
}: {
  block: Block;
  index: number;
  sticky: boolean;
}) {
  const photo = homeMedia.blocks[block.id as keyof typeof homeMedia.blocks];
  const points = POINTS[block.id] ?? [];

  return (
    <li
      data-row
      style={{ "--stick": `${STICK_TOP + index * STEP}px` } as React.CSSProperties}
      className={cn(
        "group relative border-t border-wm-olive bg-page-bg py-8 md:grid md:h-[min(62vh,520px)] md:grid-cols-12 md:gap-x-6 md:py-0",
        sticky && "md:sticky md:top-[var(--stick)]",
      )}
    >
      {/* Ảnh: trên mobile 16/10, desktop cao hết hàng (dải thu gọn khi bị hàng sau phủ lên) */}
      <div className="overflow-hidden bg-wm-mist md:col-span-3 md:h-full">
        <img
          src={photoUrl(photo.id, 640)}
          srcSet={photoSrcSet(photo.id)}
          sizes="(min-width: 768px) 25vw, 100vw"
          alt={photo.alt}
          width={640}
          height={400}
          loading="lazy"
          decoding="async"
          className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-editorial md:aspect-auto md:h-full md:group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>

      <div className="md:col-span-5">
        {/* Dòng số + tên nằm trong 44px đầu hàng để vẫn đọc được khi hàng thu thành dải */}
        <div className="mt-5 flex items-center gap-4 md:mt-0 md:h-11">
          <span className="tnum text-sm text-wm-olive">
            {String(index + 1).padStart(2, "0")}.
          </span>
          <h3 className="min-w-0 font-display text-xl font-normal leading-snug text-page-fg md:truncate">
            <Link
              to={block.href}
              data-cursor="Xem"
              className={cn(
                "inline-flex items-center gap-2 outline-none",
                'after:absolute after:inset-0 after:content-[""]',
                "focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-page-fg",
              )}
            >
              <span className="truncate underline-offset-4 group-hover:underline">
                {block.title}
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-transform duration-500 ease-editorial group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden
              />
            </Link>
          </h3>
        </div>
        <p className="mt-3 max-w-md pl-0 text-sm leading-relaxed text-page-muted md:pl-[calc(1.75rem+1rem)]">
          {block.body}
        </p>
        <p
          aria-hidden
          className="mt-4 text-sm font-medium text-page-fg md:pl-[calc(1.75rem+1rem)]"
        >
          {block.cta} →
        </p>
      </div>

      {/* Cột "Workmate lo phần này": mờ dần khi hàng bị phủ (GSAP đặt opacity/y trên [data-bullets]) */}
      <div data-bullets className="mt-5 md:col-span-4 md:mt-0 md:pt-3">
        <p className="text-xs text-wm-olive">Workmate lo phần này</p>
        <ul className="mt-2 space-y-1 text-sm text-page-muted">
          {points.map((p) => (
            <li key={p} className="flex gap-2">
              <span aria-hidden>•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/**
 * Section ③ — "Workmate giúp bạn thế nào" dạng danh sách chồng dính (sticky stacking,
 * references/p8.mp4 nửa đầu), 2–3 hàng (nhà tuyển dụng 2, còn lại 3).
 *
 * Toán dính (md+, không giảm chuyển động): hàng i dính ở top = 96 + 44·i, cao H, nền đục. Hàng i+1
 * trượt lên phủ hàng i, nên hàng i chỉ còn 44px đầu (dải ảnh + số + tên). Mỗi hàng (trừ hàng cuối)
 * có một ScrollTrigger scrub: từ lúc đỉnh hàng i+1 chạm đáy hàng i (top_i + H) đến lúc nó dính ở
 * top_{i+1} thì cột bên phải của hàng i mờ đi. Phần đệm cuối để hàng cuối đọc trọn trước khi nhả.
 *
 * Điện thoại hoặc "giảm chuyển động": không dính — danh sách dọc, vạch phân cách mảnh.
 */
export default function FeatureBlocksSection() {
  const ref = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const role = useHomeRole();
  const recruiter = role === "recruiter";

  // Nhà tuyển dụng có hai khối riêng (kèm đích nút); còn lại là các khối chung theo SHOWN
  const blocks: Block[] = recruiter
    ? homeSectionsByRole.recruiter.blocks
    : homeSections.blocks
        .filter((b) => SHOWN.includes(b.id))
        .map((b) => ({ ...b, href: HREF[b.id] }));
  const intro = recruiter
    ? homeSectionsByRole.recruiter.blocksIntro
    : homeSections.blocksIntro;
  const count = blocks.length;
  // Tiêu đề "Việc làm|vừa với|nhịp sống." → gộp các dòng thành một câu
  const title = intro.title.split("|").join(" ");

  useGSAP(
    () => {
      const list = listRef.current;
      if (reduced || !list || count < 2) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const els = gsap.utils.toArray<HTMLElement>("[data-row]", list);
        const at = (a: number) => `top${a < 0 ? "-=" : "+="}${Math.abs(a)} top`;
        els.slice(0, -1).forEach((row, i) => {
          const bullets = row.querySelector("[data-bullets]");
          if (!bullets) return;
          const tween = gsap.to(bullets, { opacity: 0, y: -8, ease: "none" });
          ScrollTrigger.create({
            trigger: list,
            animation: tween,
            scrub: true,
            invalidateOnRefresh: true,
            // đỉnh hàng i+1 chạm đáy hàng i → đỉnh hàng i+1 dính tại top_{i+1}
            start: () => at(i * row.offsetHeight - (STICK_TOP + i * STEP)),
            end: () =>
              at((i + 1) * row.offsetHeight - (STICK_TOP + (i + 1) * STEP)),
          });
        });
      });
      return () => mm.revert();
    },
    // count/role đổi (đổi vai trò) → dựng lại cho bộ hàng mới
    { scope: ref, dependencies: [reduced, count, role], revertOnUpdate: true },
  );

  return (
    <section
      ref={ref}
      data-theme="stone"
      data-theme-start="top 40%"
      data-theme-end="top 10%"
      className="shell pt-section-sm pb-section-sm"
      aria-label={
        recruiter
          ? homeSectionsByRole.recruiter.blocksLabel
          : "Workmate giúp bạn thế nào"
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <p className="eyebrow text-page-muted">
            <span className="h-px w-8 bg-page-line" />
            {intro.eyebrow}
          </p>
          <TextReveal
            text={title}
            className="mt-6 max-w-[14ch] font-display text-display-md font-normal text-page-fg"
          />
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-page-muted">
          {intro.lead}
        </p>
      </div>

      <ol ref={listRef} className="mt-12 md:mt-16">
        {blocks.map((block, i) => (
          <BlockRow key={block.id} block={block} index={i} sticky={!reduced} />
        ))}
        {/* Đệm cuối: chồng giữ nguyên thêm một đoạn cho hàng cuối đọc trọn rồi mới nhả */}
        {!reduced && <li aria-hidden className="hidden h-[28vh] md:block" />}
      </ol>
    </section>
  );
}
