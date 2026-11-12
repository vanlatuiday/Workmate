import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { gsap, ScrollTrigger, useGSAP } from "@utils/gsap";
import { useReducedMotion } from "@hooks/useReducedMotion";
import { useMediaQuery } from "@hooks/useMediaQuery";
import { useCompanyStore } from "@context/companyStore";
import { cn } from "@utils/cn";
import { photoSrcSet, photoUrl } from "@components/discover/types";
import TextReveal from "@components/motion/TextReveal";
import {
  EMPTY_FILTERS,
  filtersToParams,
  seekerOutcome,
  useAllJobs,
  type MatchJob,
} from "@pages/public/jobs/catalog";
import { homeMedia } from "./homeMedia";
import { homeSections, homeSectionsByRole } from "./content";
import { useHomeRole, type HomeRole } from "./homeData";
import FeatureJobChip, { type ChipJob } from "./FeatureJobChip";

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

/** Nội dung hai trang sau khi lật, theo id khối: đoạn giới thiệu + 3 bước bắt đầu */
const DETAIL: Record<string, { detail: string; steps: string[] }> = {
  schedule: {
    detail:
      "Bạn đánh dấu các buổi rảnh trong tuần — sáng, chiều, tối từ thứ Hai tới Chủ nhật. Workmate so từng ca của tin tuyển dụng với lịch đó và chỉ đưa lên những việc nằm gọn trong giờ bạn rảnh.",
    steps: [
      "Tạo hồ sơ và chọn các buổi rảnh trong tuần",
      "Xem việc phù hợp — điểm khớp lịch hiện ngay trên từng tin",
      "Đổi lịch bất cứ lúc nào, gợi ý tự cập nhật theo",
    ],
  },
  near: {
    detail:
      "Chọn khu vực bạn ở và quãng đường chấp nhận đi làm. Mỗi tin đều ghi rõ khoảng cách; việc nằm ngoài tầm bị trừ điểm phù hợp nên không chen vào danh sách của bạn.",
    steps: [
      "Chọn quận và bán kính đi làm trong hồ sơ",
      "Bật lọc “Gần tôi” ở trang Việc làm",
      "So khoảng cách ngay trên từng tin trước khi ứng tuyển",
    ],
  },
  match: {
    detail:
      "Bạn ứng tuyển, doanh nghiệp quan tâm hồ sơ — chỉ khi cả hai cùng đồng ý, kênh chat riêng mới mở. Họ tên đầy đủ, số điện thoại và CV chỉ hiện sau khi đã kết nối.",
    steps: [
      "Ứng tuyển những việc bạn thấy hợp",
      "Theo dõi đơn: doanh nghiệp đã xem, đang cân nhắc, đồng ý kết nối",
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
      "Ứng viên ghi khu vực và quãng đường chấp nhận đi làm. Bạn thấy ngay ai đang ở quanh cửa hàng — người ở gần thường đi làm đúng giờ và gắn bó lâu hơn.",
    steps: [
      "Đặt bán kính tuyển khi đăng tin",
      "Xem ứng viên quanh cửa hàng ở trang Kết nối",
      "Quan tâm — hai bên cùng đồng ý thì kênh chat mở",
    ],
  },
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

/** Gắn/gỡ thuộc tính `inert` (React 18 chưa có prop này): phần tử ẩn không nhận Tab/chuột/đọc màn hình */
function useInert(ref: React.RefObject<HTMLElement>, inert: boolean) {
  useEffect(() => {
    ref.current?.toggleAttribute("inert", inert);
  }); // chạy mỗi lần render: phần tử có thể mới được gắn (vd. trang phải khi đổi cỡ màn hình)
}

/** Thời gian lật trang (giây) */
const FLIP_S = 0.85;
/** Độ sâu phối cảnh của trang lật (px) — lớn để mép trang không phình quá khung thẻ lúc lật */
const FLIP_PERSPECTIVE = 3200;

const pill =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition-[filter,transform] duration-300 hover:brightness-110 active:scale-[0.97] motion-reduce:active:scale-100 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page-fg";

/**
 * Một hàng của danh sách: thẻ chia đôi, ảnh trái – chữ phải (mobile: ảnh trên, chữ dưới).
 * Nửa chữ là "trang giấy" có bản lề ở cạnh trái (giữa thẻ). Bấm "Xem chi tiết" thì trang xoay
 * rotateY 0 → 180° (lật từ phải sang trái, như sang trang sách) và nằm đè lên nửa ảnh: mặt sau
 * là trang trái, còn trang phải mới (các bước bắt đầu) lộ ra bên dưới. Mobile: phần chữ xoay tại
 * chỗ, mặt sau chứa cả hai phần xếp dọc. Giảm chuyển động: không xoay, chỉ mờ chéo ~0,2s.
 * `<li data-row>` không có transform/perspective — mọi lớp 3D nằm ở phần tử con để giữ `sticky`.
 *
 * Kính: các mặt trước/trang phải trong suốt để lộ lớp glass-liquid của <li>. Mặt sau (đè lên ảnh)
 * dùng `.glass-page` (nền ngà mờ + viền sáng), KHÔNG bật backdrop-filter kể cả khi đã nghỉ —
 * bật/tắt nó trên phần tử vừa xoay 3D dễ làm nhảy hình, nên chọn nền mờ đủ đặc (86%).
 */
function BlockRow({
  block,
  index,
  sticky,
  chip,
}: {
  block: Block;
  index: number;
  sticky: boolean;
  chip: ChipJob | null;
}) {
  const photo = homeMedia.blocks[block.id as keyof typeof homeMedia.blocks];
  const points = POINTS[block.id] ?? [];
  const detail = DETAIL[block.id];
  const num = `${String(index + 1).padStart(2, "0")}.`;
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");
  const backId = useId();

  const [flipped, setFlipped] = useState(false);
  // Mobile: hai mặt chồng chung một ô lưới nên ô cao bằng mặt sau (dài hơn) → mặt trước thừa khoảng trống.
  // Khi đã nghỉ ở mặt trước (không đang xoay) thì mặt sau không chiếm chiều cao.
  const [settled, setSettled] = useState(true);
  const flippedRef = useRef(false);
  const busyRef = useRef(false);
  const timerRef = useRef<number>();
  const pageRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const backTitleRef = useRef<HTMLHeadingElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);

  // Mặt đang ẩn không cho Tab lọt vào; trang phải mới chưa lộ cũng vậy;
  // ô việc bị trang trái (đè lên ảnh) che khi đã lật (md+) cũng vậy
  useInert(frontRef, flipped);
  useInert(backRef, !flipped);
  useInert(nextRef, !flipped);
  useInert(chipRef, flipped && wide);

  // Đổi cỡ màn hình / chế độ giảm chuyển động: đặt lại góc xoay và độ hiện cho đúng bố cục mới
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const next = nextRef.current;
    if (reduced) {
      gsap.set(page, { clearProps: "transform,transformOrigin" });
      if (next) gsap.set(next, { clearProps: "opacity" });
      return;
    }
    gsap.set(page, {
      transformPerspective: FLIP_PERSPECTIVE,
      transformOrigin: wide ? "0% 50%" : "50% 50%",
      rotateY: flippedRef.current ? 180 : 0,
    });
    if (next) gsap.set(next, { opacity: flippedRef.current ? 1 : 0 });
  }, [wide, reduced]);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      [pageRef, nextRef, shadowRef].forEach((r) => {
        if (r.current) gsap.killTweensOf(r.current);
      });
    },
    [],
  );

  const flip = (to: boolean) => {
    const page = pageRef.current;
    if (busyRef.current || !page) return;
    busyRef.current = true;
    flippedRef.current = to;
    setFlipped(to);
    setSettled(false);
    const done = () => {
      busyRef.current = false;
      setSettled(true);
      if (!wide) requestAnimationFrame(() => ScrollTrigger.refresh()); // chiều cao thẻ mobile vừa đổi
      (to ? backTitleRef : openRef).current?.focus({ preventScroll: true });
    };
    if (reduced) {
      timerRef.current = window.setTimeout(done, 200);
      return;
    }
    gsap.to(page, {
      rotateY: to ? 180 : 0,
      duration: FLIP_S,
      ease: "power3.inOut",
      onComplete: done,
    });
    if (wide) {
      // Trang phải mới chỉ hiện khi trang lật đã dựng quá 90° (power3.inOut: giữa thời gian = 90°),
      // để chữ mặt trước không chồng lên nó: lật mở 45% → 85%; lật về thì ẩn xong trước khi mặt trước quay lại (15% → 45%)
      if (nextRef.current)
        gsap.to(nextRef.current, {
          opacity: to ? 1 : 0,
          duration: FLIP_S * 0.3 + (to ? FLIP_S * 0.1 : 0),
          delay: FLIP_S * (to ? 0.45 : 0.15),
          ease: "none",
          overwrite: true,
        });
      // Bóng mờ trên trang phải chạy theo trang: đậm dần tới giữa lúc lật rồi tan
      if (shadowRef.current)
        gsap.fromTo(
          shadowRef.current,
          { opacity: 0 },
          { opacity: 1, duration: FLIP_S / 2, ease: "power1.inOut", yoyo: true, repeat: 1 },
        );
    }
  };

  const onEsc = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && flipped) {
      e.stopPropagation();
      flip(false);
    }
  };

  // Chế độ giảm chuyển động: mờ chéo; còn lại: hai mặt úp lưng nhau, mặt sau xoay sẵn 180°
  const fade = "transition-opacity duration-200 motion-reduce:duration-200";
  const stripCls = "flex h-11 shrink-0 items-center gap-4 px-5 md:px-8";
  const padCls = "px-5 md:px-8";

  // Trang phải mới: tiêu đề, 3 bước, hàng nút. Dùng ở trang phải (md+) hoặc cuối mặt sau (mobile)
  const nextContent = (
    <>
      <div className={stripCls}>
        <span className="truncate text-sm text-page-muted">Bắt đầu</span>
      </div>
      <div className={cn("flex flex-1 flex-col pb-5 md:min-h-0 md:pb-6", padCls)}>
        <h4 className="font-display text-xl font-semibold leading-snug text-page-fg md:text-2xl">
          Bắt đầu trong 3 bước
        </h4>
        <ol className="mt-3 divide-y divide-page-line border-y border-page-line">
          {(detail?.steps ?? []).map((s, i) => (
            <li key={s} className="flex gap-4 py-2.5 text-sm leading-snug text-page-fg">
              <span className="tnum w-6 shrink-0 text-page-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-4">
          <Link to={block.href} data-cursor="Xem" className={pill}>
            {block.cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => flip(false)}
            className="inline-flex min-h-11 items-center rounded-full border border-page-line px-5 py-3 text-sm font-medium text-page-fg outline-none transition-[border-color,transform] duration-300 hover:border-page-fg active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page-fg"
          >
            Quay lại
          </button>
        </div>
      </div>
    </>
  );

  return (
    <li
      data-row
      style={{ "--stick": `${STICK_TOP + index * STEP}px` } as React.CSSProperties}
      className={cn(
        // Thẻ kính lỏng (glass-liquid, references/p13): trong, nhòe mạnh, viền sáng ở mép;
        // thẻ sau trượt lên thì thẻ trước nhòe qua lớp kính. overflow-hidden giữ trang lật nằm trong khuôn thẻ bo góc.
        // Kính dày hơn mặc định: thẻ chồng lên nhau, nhòe 28px + nền ngà 45% để chữ/nút của thẻ phía sau không lộ qua
        "glass-liquid group mb-4 overflow-hidden rounded-card bg-wm-ivory/[0.45] [--glass-blur:28px] md:mb-0 md:h-[min(62vh,520px)]",
        sticky && "md:sticky md:top-[var(--stick)]",
      )}
    >
      <div className="relative flex flex-col md:h-full">
        {/* Ảnh: mobile 16/10 ở trên; desktop nửa trái, cao hết thẻ */}
        <div className="relative aspect-[16/10] overflow-hidden bg-wm-mist md:absolute md:inset-y-0 md:left-0 md:aspect-auto md:w-1/2">
          <img
            src={photoUrl(photo.id, 960)}
            srcSet={photoSrcSet(photo.id)}
            sizes="(min-width: 768px) 50vw, 100vw"
            alt={photo.alt}
            width={960}
            height={600}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-editorial md:group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {/* Bản sao nhòe sẵn (không animate filter): GSAP chỉ scrub opacity 0 → 1 khi thẻ sau phủ lên (md+).
              Mobile / giảm chuyển động: luôn opacity 0. Nằm dưới ô kính và dưới trang lật. */}
          <div
            data-blur
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-0"
          >
            <img
              src={photoUrl(photo.id, 960)}
              alt=""
              width={960}
              height={600}
              loading="lazy"
              decoding="async"
              className="h-full w-full scale-110 object-cover blur-[14px]"
            />
            <div className="absolute inset-0 bg-wm-charcoal/10" />
          </div>
          {chip && (
            <div ref={chipRef} data-chip className="contents">
              <FeatureJobChip item={chip} />
            </div>
          )}
        </div>

        {/* Trang phải mới (md+): nằm dưới trang lật, trong suốt để lộ kính của thẻ; ẩn hẳn khi chưa lật */}
        {wide && (
          <>
            <div
              ref={nextRef}
              onKeyDown={onEsc}
              className={cn(
                "absolute inset-y-0 right-0 z-0 flex w-1/2 flex-col border-l border-page-line opacity-0",
                reduced && fade,
                reduced && flipped && "opacity-100",
              )}
            >
              {nextContent}
            </div>
            {/* Bóng đổ của trang đang lật lên trang phải */}
            {!reduced && (
              <div
                ref={shadowRef}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-1/2 bg-gradient-to-r from-wm-charcoal/25 to-transparent opacity-0"
              />
            )}
          </>
        )}

        {/* Trang lật: nửa phải, bản lề ở cạnh trái (md+); mobile là khối chữ phía dưới ảnh */}
        <div
          ref={pageRef}
          className="relative grid md:absolute md:inset-y-0 md:right-0 md:z-10 md:w-1/2 [transform-style:preserve-3d]"
        >
          {/* Mặt trước: trong suốt */}
          <div
            ref={frontRef}
            className={cn(
              "flex flex-col [grid-area:1/1] md:absolute md:inset-0",
              !reduced && "[backface-visibility:hidden]",
              reduced && fade,
              reduced && flipped && "opacity-0",
            )}
          >
            {/* Dải 44px đầu: vẫn đọc được khi hàng sau phủ lên */}
            <div className={stripCls}>
              <span className="tnum text-sm text-page-muted">{num}</span>
              <span className="truncate text-sm text-page-fg">{block.label}</span>
            </div>
            <div className="flex flex-1 flex-col justify-center px-5 pb-6 pt-2 md:px-8 md:pb-8 md:pt-0">
              <h3 className="text-balance font-display text-3xl font-semibold leading-[1.1] text-page-fg md:text-4xl">
                {block.title}
              </h3>
              <div data-bullets className="mt-4">
                <p className="max-w-md text-sm leading-relaxed text-page-muted">
                  {block.body}
                </p>
                <button
                  ref={openRef}
                  type="button"
                  data-cursor="Xem"
                  aria-expanded={flipped}
                  aria-controls={backId}
                  onClick={() => flip(true)}
                  className={cn(pill, "mt-6")}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>

          {/* Mặt sau = trang trái (md+, đè lên ảnh). Mobile: thêm trang phải xếp dọc bên dưới.
              Giảm chuyển động + md+: không xoay, đặt sẵn ở nửa trái rồi mờ chéo. */}
          <div
            ref={backRef}
            id={backId}
            onKeyDown={onEsc}
            className={cn(
              "glass-page flex flex-col [grid-area:1/1] md:absolute",
              !wide && !flipped && settled && "max-h-0 overflow-hidden",
              reduced ? "md:inset-y-0 md:right-full md:w-full" : "md:inset-0",
              !reduced && "[backface-visibility:hidden] [transform:rotateY(180deg)]",
              reduced && fade,
              reduced && !flipped && "opacity-0",
            )}
          >
            <div className={stripCls}>
              <span className="tnum text-sm text-page-muted">{num}</span>
              <span className="truncate text-sm text-page-fg">{block.label}</span>
            </div>
            <div className={cn("flex flex-col pb-5 md:min-h-0 md:flex-1 md:pb-6", padCls)}>
              <p className="text-xs text-page-muted">Workmate lo phần này</p>
              <h3
                ref={backTitleRef}
                tabIndex={-1}
                className="mt-1 text-balance font-display text-xl font-semibold leading-snug text-page-fg outline-none md:text-2xl"
              >
                {block.title}
              </h3>
              <p className="mt-2 text-sm leading-snug text-page-muted">
                {detail?.detail ?? block.body}
              </p>
              <ul className="mt-2.5 space-y-1 text-sm leading-snug text-page-fg">
                {points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span aria-hidden>•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            {!wide && (
              <div className="flex flex-col border-t border-page-line">{nextContent}</div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** ISO đăng tin của một việc (CatalogJob có, kiểu MatchJob không khai) → số để so sánh */
const postedMs = (j: MatchJob) =>
  Date.parse((j as MatchJob & { postedAt?: string }).postedAt ?? "") || 0;

/** Chọn một việc thật cho ô kính của từng khối (xem quy tắc ở từng nhánh) */
function useChipJobs(blocks: Block[], role: HomeRole): (ChipJob | null)[] {
  const jobs = useAllJobs();
  const companyId = useCompanyStore((s) => s.id);
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
          const best = [...jobs].sort(
            (a, c) => seekerOutcome(c).score - seekerOutcome(a).score,
          )[0];
          if (best)
            pick = {
              job: best,
              tag: `${Math.round(seekerOutcome(best).score)}% phù hợp lịch của bạn`,
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
  }, [blocks, role, jobs, companyId]);
}

/**
 * Section ③ — "Workmate giúp bạn thế nào" dạng danh sách chồng dính (sticky stacking,
 * references/p8.mp4 nửa đầu), 2–3 hàng (nhà tuyển dụng 2, còn lại 3).
 *
 * Toán dính (md+, không giảm chuyển động): hàng i dính ở top = 96 + 44·i, cao H, nền kính gần đặc. Hàng i+1
 * trượt lên phủ hàng i, nên hàng i chỉ còn 44px đầu (dải ảnh + số + tên). Mỗi hàng (trừ hàng cuối)
 * có một ScrollTrigger scrub: từ lúc đỉnh hàng i+1 chạm đáy hàng i (top_i + H) đến lúc nó dính ở
 * top_{i+1} thì cột bên phải của hàng i mờ đi. Phần đệm cuối để hàng cuối đọc trọn trước khi nhả.
 *
 * Mỗi hàng là một thẻ kính sáng (ảnh + nội dung chung một khối bo góc).
 * Điện thoại hoặc "giảm chuyển động": không dính — các thẻ xếp dọc, cách nhau một khoảng.
 */
export default function FeatureBlocksSection() {
  const ref = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const role = useHomeRole();
  const recruiter = role === "recruiter";

  // Nhà tuyển dụng có hai khối riêng (kèm đích nút); còn lại là các khối chung theo SHOWN
  const blocks: Block[] = useMemo(
    () =>
      recruiter
        ? homeSectionsByRole.recruiter.blocks
        : homeSections.blocks
            .filter((b) => SHOWN.includes(b.id))
            .map((b) => ({ ...b, href: HREF[b.id] })),
    [recruiter],
  );
  const intro = recruiter
    ? homeSectionsByRole.recruiter.blocksIntro
    : homeSections.blocksIntro;
  const count = blocks.length;
  const chips = useChipJobs(blocks, role);
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
          // Cùng một timeline scrub: chữ phụ mờ đi, ảnh nhòe dần (opacity bản sao), ô kính việc mờ theo ảnh
          const tween = gsap.timeline({ defaults: { ease: "none" } });
          tween.to(bullets, { opacity: 0, y: -8 }, 0);
          const blur = row.querySelector("[data-blur]");
          if (blur) tween.to(blur, { opacity: 1 }, 0);
          const chipEl = row.querySelector("[data-chip]")?.firstElementChild;
          if (chipEl) tween.to(chipEl, { opacity: 0 }, 0);
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
      data-theme="ivory"
      // Than chì → ngà: đoạn chuyển dài (85% → 20%), xong trước khi hàng đầu bắt đầu dính (đỉnh danh sách còn cách đỉnh section phần tiêu đề, tới ~96px)
      data-theme-start="top 85%"
      data-theme-end="top 20%"
      className="relative z-10 shell pt-section-sm pb-section-sm"
      aria-label={
        recruiter
          ? homeSectionsByRole.recruiter.blocksLabel
          : "Workmate giúp bạn thế nào"
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <p className="eyebrow text-page-muted">
                        {intro.eyebrow}
          </p>
          <TextReveal
            text={title}
            className="mt-6 max-w-[14ch] font-display text-display-md font-semibold text-page-fg"
          />
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-page-muted">
          {intro.lead}
        </p>
      </div>

      <ol ref={listRef} className="mt-12 md:mt-16">
        {blocks.map((block, i) => (
          <BlockRow
            key={block.id}
            block={block}
            index={i}
            sticky={!reduced}
            chip={chips[i] ?? null}
          />
        ))}
        {/* Đệm cuối: chồng giữ nguyên thêm một đoạn cho hàng cuối đọc trọn rồi mới nhả */}
        {!reduced && <li aria-hidden className="hidden h-[28vh] md:block" />}
      </ol>
    </section>
  );
}
