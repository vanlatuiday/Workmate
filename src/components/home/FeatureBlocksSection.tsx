import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { useHomeReducedMotion } from "@hooks/useHomeReducedMotion";
import { useCompanyStore } from "@context/companyStore";
import { cn } from "@utils/cn";
import { photoSrcSet, photoUrl } from "@components/discover/types";
import {
  EMPTY_FILTERS,
  filtersToParams,
  useAllJobs,
  useSeekerOutcomes,
  type MatchJob,
} from "@pages/public/jobs/catalog";
import { homeMedia } from "./homeMedia";
import { homeSections, homeSectionsByRole } from "./content";
import { useHomeRole, type HomeRole } from "./homeData";
import LightCurves from './LightCurves'
import FeatureJobChip, { type ChipJob } from "./FeatureJobChip";
import scheduleArt from "@assets/images/home-feature-schedule.webp";
import nearArt from "@assets/images/home-feature-near.webp";
import matchArt from "@assets/images/home-feature-match.webp";

/**
 * Hình minh họa nền trong suốt (chủ dự án 2026-11-21, references/themota — ảnh tạm, chủ dự án sẽ làm lại cho
 * khớp web): đặt thẳng trên nền xanh, không khung, không bo góc. Khối không có hình riêng (vai nhà tuyển dụng)
 * dùng ảnh chụp với mép tan dần vào nền.
 */
const ART: Record<string, { src: string; alt: string }> = {
  schedule: { src: scheduleArt, alt: "Minh họa màn hình chọn lịch rảnh trong tuần trên Workmate" },
  near: { src: nearArt, alt: "Minh họa danh sách việc gần bạn kèm khoảng cách và bản đồ" },
  match: { src: matchArt, alt: "Minh họa khung trò chuyện sau khi kết nối: các bước ứng tuyển, tin nhắn với nhà tuyển dụng và chọn lịch phỏng vấn" },
  // Nhà tuyển dụng dùng chung 2 ảnh minh họa của bên tìm việc (chủ dự án 2026-11-22) thay cho ảnh chụp
  slots: { src: scheduleArt, alt: "Minh họa bảng chọn buổi trong tuần: tô ca cần người, Workmate tìm người rảnh đúng các ca đó" },
  nearby: { src: nearArt, alt: "Minh họa danh sách gần đây kèm khoảng cách và bản đồ quanh cửa hàng" },
};
/** Mặt nạ tan mép cho ảnh chụp (không có nền trong suốt) để không thành khối chữ nhật trên nền */
const PHOTO_FADE = "photo-fade";

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

/** Nội dung mở rộng của từng mục: đoạn giới thiệu + 3 bước bắt đầu */
const DETAIL: Record<string, { detail: string; steps: string[] }> = {
  schedule: {
    detail:
      "Bạn đánh dấu các buổi rảnh trong tuần: sáng, chiều, tối, khuya từ thứ Hai tới Chủ nhật. Workmate so từng ca của tin tuyển dụng với lịch đó và chỉ đưa lên những việc nằm gọn trong giờ bạn rảnh.",
    steps: [
      "Chọn buổi rảnh trong hồ sơ",
      "Xem điểm phù hợp trên từng tin",
      "Cập nhật khi lịch thay đổi",
    ],
  },
  near: {
    detail:
      "Chọn khu vực bạn ở và quãng đường chấp nhận đi làm. Mỗi tin đều ghi rõ khoảng cách; việc nằm ngoài tầm bị trừ điểm phù hợp nên không chen vào danh sách của bạn.",
    steps: [
      "Chọn khu vực và bán kính đi làm",
      "Bật lọc “Gần tôi” ở trang Việc làm",
      "So khoảng cách trước khi ứng tuyển",
    ],
  },
  match: {
    detail:
      "Bạn ứng tuyển, nhà tuyển dụng quan tâm hồ sơ. Chỉ khi cả hai cùng đồng ý, kênh chat riêng mới mở. Họ tên đầy đủ, số điện thoại và CV chỉ hiện sau khi đã kết nối.",
    steps: [
      "Ứng tuyển những việc bạn thấy hợp",
      "Theo dõi đơn: nhà tuyển dụng đã xem, đang cân nhắc, đồng ý kết nối",
      "Nhắn tin và chọn giờ phỏng vấn ngay trong chat",
    ],
  },
  guide: {
    detail:
      "Những bài viết ngắn, dễ làm theo cho người đi làm linh hoạt: viết hồ sơ gọn, chuẩn bị cho ca đầu tiên và hiểu quyền lợi của mình.",
    steps: [
      "Chọn chủ đề bạn đang cần",
      "Đọc trong vài phút, có ví dụ cụ thể",
      "Áp dụng ngay vào hồ sơ và buổi phỏng vấn",
    ],
  },
  // Nhà tuyển dụng
  slots: {
    detail:
      "Khi đăng tin, bạn tô các ca cần người trên lưới tuần. Workmate chỉ gợi ý những ứng viên có lịch rảnh trùng các ca đó, kèm điểm phù hợp để bạn chọn nhanh.",
    steps: [
      "Đăng tin và tô các ca cần người",
      "Đánh dấu kỹ năng bắt buộc nếu có",
      "Xem ứng viên phù hợp và quan tâm người bạn ưng",
    ],
  },
  nearby: {
    detail:
      "Ứng viên ghi khu vực và quãng đường chấp nhận đi làm. Bạn thấy ngay ai đang ở quanh cửa hàng. Người ở gần thường đi làm đúng giờ và gắn bó lâu hơn.",
    steps: [
      "Đặt bán kính tuyển khi đăng tin",
      "Xem ứng viên quanh cửa hàng ở trang Kết nối",
      "Quan tâm, hai bên cùng đồng ý thì kênh chat mở",
    ],
  },
};

type Block = {
  id: string;
  label: string;
  title: string;
  body: string;
  cta: string;
  detailLabel?: string;
  href: string;
};

/** ISO đăng tin của một việc (CatalogJob có, kiểu MatchJob không khai) → số để so sánh */
const postedMs = (j: MatchJob) =>
  Date.parse((j as MatchJob & { postedAt?: string }).postedAt ?? "") || 0;

/** Chọn một việc thật cho ô kính của từng khối (xem quy tắc ở từng nhánh) */
function useChipJobs(blocks: Block[], role: HomeRole): (ChipJob | null)[] {
  const jobs = useAllJobs();
  const companyId = useCompanyStore((s) => s.id);
  const { outcomeOf } = useSeekerOutcomes();
  return useMemo(() => {
    const newest = (list: MatchJob[]) =>
      [...list].sort((a, b) => postedMs(b) - postedMs(a));
    const km = (n: number) => `${n.toFixed(1).replace(".", ",")} km`;
    if (role === "recruiter") {
      const mine = newest(jobs.filter((j) => companyId && j.companyId === companyId));
      return blocks.map(() =>
        mine[0] ? { job: mine[0], tag: "Tin mới nhất của bạn" } : null,
      );
    }
    const used = new Set<string>();
    return blocks.map((b): ChipJob | null => {
      let pick: ChipJob | null = null;
      if (b.id === "schedule") {
        if (role === "jobseeker") {
          // Chỉ xét tin đã có điểm từ máy chủ
          const best = jobs
            .flatMap((job) => { const o = outcomeOf(job); return o ? [{ job, score: o.score }] : [] })
            .sort((a, c) => c.score - a.score)[0];
          if (best)
            pick = {
              job: best.job,
              tag: `${Math.round(best.score)}% phù hợp lịch của bạn`,
            };
        } else if (newest(jobs)[0]) {
          pick = { job: newest(jobs)[0], tag: "Mới đăng" };
        }
      } else if (b.id === "near") {
        const close = [...jobs].sort((a, c) => a.distanceKm - c.distanceKm)[0];
        if (close)
          pick = { job: close, tag: `Gần bạn nhất · ${km(close.distanceKm)}` };
      } else {
        const list = newest(jobs);
        const j = list.find((x) => !used.has(x.id)) ?? list[0];
        if (j) pick = { job: j, tag: "Đang tuyển" };
      }
      if (pick) used.add(pick.job.id);
      return pick;
    });
  }, [blocks, role, jobs, companyId, outcomeOf]);
}

/**
 * Section ③ — "Workmate giúp bạn thế nào": không khung bao (2026-11-21), trái là danh sách 2–3 mục, phải là hình minh họa nổi trên nền
 * (chủ dự án 2026-11-20, theo taste skill "ví dụ 1": thay danh sách chồng dính — không có gì chạy theo cuộn).
 * Rê chuột / focus / bấm một mục → mục đó mở ra (đoạn giới thiệu + 3 bước + nút), ảnh bên phải đổi mờ chéo
 * 0,3 s (chỉ opacity). Rê ảnh: phóng 1.02 trong khung. Ô kính việc thật nằm gọn trong góc ảnh.
 * Kính tối theo ui-ux-pro-max: nền abyss trong suốt + blur ~16px + viền ngà 1px; chữ ngà ≥ 4.5:1.
 * Điện thoại: danh sách, mục đang mở có ảnh ngay dưới chữ (không có khung ảnh bên phải).
 * Giảm chuyển động: đổi tức thì.
 */
export default function FeatureBlocksSection() {
  const reduced = useHomeReducedMotion();
  const role = useHomeRole();
  const recruiter = role === "recruiter";
  const blocks: Block[] = useMemo(
    () =>
      recruiter
        ? homeSectionsByRole.recruiter.blocks
        : homeSections.blocks
            .filter((b) => SHOWN.includes(b.id))
            .map((b) => ({ ...b, href: HREF[b.id] })),
    [recruiter],
  );
  const chips = useChipJobs(blocks, role);
  const [active, setActive] = useState(0);
  const fade = reduced ? "" : "transition-opacity duration-300 ease-out";

  const photoOf = (b: Block) => homeMedia.blocks[b.id as keyof typeof homeMedia.blocks];

  return (
    <section
      data-theme="night"
      className="relative isolate z-10 overflow-x-clip px-4 pb-section-sm pt-section-sm md:px-[max(16px,2.5vw)]"
      aria-label={recruiter ? homeSectionsByRole.recruiter.blocksLabel : "Workmate giúp bạn thế nào"}
    >
      {/* Dải cong sáng sau hình (cùng kiểu mục "Workmate ghép việc…") */}
      <LightCurves side="right" />
      {/* Không khung bao (chủ dự án 2026-11-21): chữ và hình nằm thẳng trên nền sao */}
      <div className="grid lg:min-h-[min(80svh,720px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
        {/* Trái: danh sách */}
        <ul className="flex flex-col justify-center gap-2 p-4 sm:p-6 lg:p-10">
          {blocks.map((b, i) => {
            const open = i === active;
            const d = DETAIL[b.id];
            const photo = photoOf(b);
            return (
              <li key={b.id}>
                <div
                  onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                  className={cn(
                    "relative rounded-card border p-5 transition-colors duration-300",
                    open ? "border-transparent bg-wm-ivory/[0.05]" : "border-transparent hover:bg-wm-ivory/[0.04]",
                  )}
                >
                  {/* Vạch sáng mép trái cho mục đang mở */}
                  <span aria-hidden className={cn("absolute inset-y-5 left-0 w-[3px] rounded-full bg-wm-cyan", fade, open ? "opacity-100" : "opacity-0")} />
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`feature-${b.id}`}
                    onClick={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className="flex w-full items-baseline justify-between gap-4 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wm-ivory"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-wm-ivory/70">{b.label}</span>
                      <span className={cn("mt-1 block font-display text-2xl font-semibold leading-tight lg:text-3xl", open ? "text-wm-ivory" : "text-wm-ivory/75")}>
                        {b.title}
                      </span>
                    </span>
                    <ArrowRight aria-hidden className={cn("h-5 w-5 shrink-0 text-wm-ivory transition-transform duration-300", open ? "rotate-90" : "opacity-50")} />
                  </button>
                  {/* Nội dung mở rộng: grid-rows 0fr → 1fr để mở mượt mà không đo chiều cao */}
                  <div
                    id={`feature-${b.id}`}
                    className={cn("grid", reduced ? "" : "transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
                  >
                    {/* inert (React 18 chưa có prop): nội dung đang đóng không nhận Tab/đọc màn hình */}
                    <div className="min-h-0 overflow-hidden" {...((!open ? { inert: "" } : {}) as Record<string, string>)}>
                      <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-wm-ivory/85 md:text-base">{b.body}</p>
                      {d && (
                        <ol className="mt-4 space-y-2">
                          {d.steps.map((st, k) => (
                            <li key={st} className="flex gap-3 text-sm text-wm-ivory/85">
                              <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-wm-ivory/30 text-xs font-semibold text-wm-ivory">{k + 1}</span>
                              <span className="pt-0.5">{st}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                      <Link
                        to={b.href}
                        className="group mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-wm-ivory/60 px-5 text-sm font-semibold text-wm-ivory transition-colors duration-300 hover:bg-wm-ivory hover:text-wm-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wm-ivory"
                      >
                        {b.cta}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                      </Link>
                      {/* Điện thoại / máy tính bảng: ảnh của mục ngay dưới chữ */}
                      {ART[b.id] ? (
                        <img src={ART[b.id].src} alt={ART[b.id].alt} width={1400} height={788} loading="lazy" decoding="async" className="mt-5 h-auto w-full lg:hidden" />
                      ) : photo && (
                        <div className={cn("relative mt-5 aspect-[16/10] lg:hidden", PHOTO_FADE)}>
                          <img src={photoUrl(photo, 900)} srcSet={photoSrcSet(photo)} sizes="100vw" alt={photo.alt} width={900} height={563} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Phải: hình của mục đang mở, nổi thẳng trên nền; đổi mục → hình cũ mờ đi, hình mới hiện dần và trôi lên nhẹ */}
        <div className="relative hidden lg:block lg:aspect-[16/10]">
          {blocks.map((b, i) => {
            const art = ART[b.id];
            const photo = photoOf(b);
            if (!art && !photo) return null;
            const on = i === active;
            const motion = reduced ? "" : "transition-[opacity,transform] duration-500 ease-out";
            const state = on ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3";
            return art ? (
              <img
                key={b.id}
                src={art.src}
                width={1400}
                height={788}
                alt={on ? art.alt : ""}
                aria-hidden={!on}
                loading="lazy"
                decoding="async"
                className={cn("absolute inset-0 h-full w-full object-contain", motion, state)}
              />
            ) : (
              <img
                key={b.id}
                src={photoUrl(photo!, 1400)}
                srcSet={photoSrcSet(photo!)}
                sizes="55vw"
                width={1400}
                height={1050}
                alt={on ? photo!.alt : ""}
                aria-hidden={!on}
                loading="lazy"
                decoding="async"
                className={cn("absolute inset-0 h-full w-full object-cover", PHOTO_FADE, motion, state)}
              />
            );
          })}
          {/* Ô việc thật của mục đang mở (chữ than chì trên kính sáng) */}
          {/* Ô việc thật: kính trắng xanh cùng tông hình, nằm dưới mép trái hình — không che vòng sáng */}
          {chips[active] && <FeatureJobChip item={chips[active]!} />}
        </div>
      </div>
    </section>
  );
}
