import { useRef } from "react";

import { useReducedMotion } from "@hooks/useReducedMotion";
import { useMediaQuery, FINE_POINTER } from "@hooks/useMediaQuery";
import { gsap, ScrollTrigger, useGSAP } from "@utils/gsap";

// Lưới của cảnh (đơn vị viewBox 1200×252)
const GROUND = 200; // mặt đường
const SHOP_W = 190;
const SHOP_X0 = 40;
const SHOP_GAP = 20;
const SHOP_TOP = 60;
const DOOR_X = 126; // lề trái cửa so với mép tiệm
const DOOR_W = 44;

// Năm tiệm trên con phố (nội dung mẫu). Tiệm đầu tiên là tiệm Workmate được tô đặc.
const SHOPS = [
  { sign: "Workmate", kind: "highlight" },
  { sign: "Cà phê", kind: "cafe" },
  { sign: "Tiện lợi", kind: "store" },
  { sign: "Giao hàng", kind: "delivery" },
  { sign: "Bánh mì", kind: "bakery" },
] as const;

// Người đi bộ: cao ~64 đơn vị (cửa cao 72). Gốc tọa độ ở mặt đất, dưới bàn chân.
const ANKLE = 3; // cổ chân cao hơn mặt đất (giày dày 3)
const THIGH = 13;
const SHIN = 14;
const TORSO = 18;
const SHOULDER = 16.5; // vai thấp hơn đỉnh thân một chút
const ARM = 9; // bắp tay (tay áo)
const FORE = 8; // cẳng tay
const SWING = 28; // biên độ vung chân (độ)
// Quãng đường một chu kỳ (hai bước) = 2 bước × 2·chân·sin(biên độ) — khớp để chân không trượt
const STRIDE = 4 * (THIGH + SHIN) * Math.sin((SWING * Math.PI) / 180);
const WALK_START = SHOP_X0 + DOOR_X + DOOR_W / 2; // bước ra từ cửa tiệm Workmate
const WALK_END = 1240; // ra khỏi mép phải
const REST_X = SHOP_X0 + DOOR_X + DOOR_W + 14; // đứng yên ngay cạnh cửa khi giảm chuyển động
const TRAVEL = 18; // giây để băng qua cảnh

type Pose = Record<string, string>;

/** Tư thế các khớp ở pha p (0–1 = một chu kỳ hai bước). still = đứng nghiêm. */
function pose(p: number, still = false): Pose {
  const s = still ? 0 : Math.sin(2 * Math.PI * p);
  const c = still ? 0 : Math.cos(2 * Math.PI * p);
  // Hông hạ xuống đúng bằng độ chân xiên đi → chân sau luôn chạm đất, thân nhấp nhô tự nhiên
  const hipY = ANKLE + (THIGH + SHIN) * Math.cos((SWING * s * Math.PI) / 180);
  // Chân trước = góc âm; gối chỉ gập lúc vung chân tới
  const thL = -SWING * s;
  const thR = SWING * s;
  const kneeL = 42 * Math.max(0, c);
  const kneeR = 42 * Math.max(0, -c);
  // Bàn chân giữ phẳng so với mặt đất, nhấc gót lúc đạp đi (chân ở phía sau), mũi hơi hếch lúc vung
  const footL = still
    ? 0
    : -(thL + kneeL) + 24 * Math.max(0, -s) - 10 * Math.max(0, c);
  const footR = still
    ? 0
    : -(thR + kneeR) + 24 * Math.max(0, s) - 10 * Math.max(0, -c);
  return {
    body: `translate(0 ${-hipY})`,
    legL: `rotate(${thL})`,
    legR: `rotate(${thR})`,
    shinL: `translate(0 ${THIGH}) rotate(${kneeL})`,
    shinR: `translate(0 ${THIGH}) rotate(${kneeR})`,
    footL: `translate(0 ${SHIN}) rotate(${footL})`,
    footR: `translate(0 ${SHIN}) rotate(${footR})`,
    // Tay đánh ngược chân cùng bên
    armL: `translate(0 ${-SHOULDER}) rotate(${24 * s})`,
    armR: `translate(0 ${-SHOULDER}) rotate(${-24 * s})`,
    foreL: `translate(0 ${ARM}) rotate(${-(10 + 18 * Math.max(0, -s))})`,
    foreR: `translate(0 ${ARM}) rotate(${-(10 + 18 * Math.max(0, s))})`,
    // Ba lô lắc nhẹ theo nhịp bước, quanh mép trên
    bag: `rotate(${3 * c} -7 -15)`,
  };
}

const STILL = pose(0, true);

/** Cây dừa nét mảnh: thân cong, sáu lá cong, hai quả; gốc ở (x, mặt đất) */
function Palm({ x, h }: { x: number; h: number }) {
  const ty = GROUND - h;
  const tx = x + 4;
  return (
    <g>
      <path d={`M${x} ${GROUND} Q${x + 7} ${GROUND - h / 2} ${tx} ${ty}`} />
      <path
        d={[
          `M${tx} ${ty} q-8 -14 -26 -6`,
          `M${tx} ${ty} q-12 -4 -24 10`,
          `M${tx} ${ty} q8 -14 26 -6`,
          `M${tx} ${ty} q12 -4 24 10`,
          `M${tx} ${ty} q-2 -12 -12 -16`,
          `M${tx} ${ty} q2 -12 12 -16`,
        ].join(" ")}
      />
      <circle cx={tx - 3} cy={ty + 4} r={2} />
      <circle cx={tx + 3} cy={ty + 4} r={2} />
    </g>
  );
}

/** Đám mây: gốc (x, y) là mép dưới bên trái */
function Cloud({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y} h44 a8 8 0 0 0 0 -16 a11 11 0 0 0 -21 -4 a9 9 0 0 0 -17 6 a7 7 0 0 0 -6 14 z`}
    />
  );
}

// Rê chuột vào tiệm: biển hiệu nhích lên, ô cửa sổ sáng nhẹ, cánh cửa hé từ phía bản lề (300ms)
const LIFT =
  "transition-transform duration-300 ease-out group-hover:-translate-y-[3px]";
const GLOW =
  "transition-opacity duration-300 ease-out opacity-0 group-hover:opacity-[0.15]";
const DOOR =
  "transition-transform duration-300 ease-out [transform-box:fill-box] origin-left group-hover:scale-x-[0.88]";

function Shop({ i, live }: { i: number; live: boolean }) {
  const { sign, kind } = SHOPS[i];
  const x = SHOP_X0 + i * (SHOP_W + SHOP_GAP);
  const t = SHOP_TOP;
  const hl = kind === "highlight";
  // Chi tiết bên trong tiệm tô đặc phải đổi sang màu nền
  const inner = hl ? "stroke-page-bg" : "";
  const winY = GROUND - 78;
  const doorX = x + DOOR_X;
  const doorTop = GROUND - 72;
  const n = 8;
  const sw = (SHOP_W - 24) / n;

  return (
    // live = chuột thật + không giảm chuyển động; chỉ tiệm Workmate có nhãn con trỏ
    <g
      className={live ? "group" : undefined}
      data-cursor={hl ? "Chào bạn" : undefined}
    >
      {/* Vùng bắt chuột trong suốt phủ cả tiệm (thân tiệm không tô nên ruột rỗng không nhận chuột) */}
      {live && (
        <rect
          x={x}
          y={t}
          width={SHOP_W}
          height={GROUND - t}
          fill="transparent"
          stroke="none"
        />
      )}
      {/* Thân tiệm */}
      <path
        d={`M${x} ${GROUND} V${t} H${x + SHOP_W} V${GROUND}`}
        fill={hl ? "currentColor" : "none"}
      />

      <g className={inner}>
        {/* Bảng hiệu, chữ canh giữa */}
        <rect
          x={x + 20}
          y={t + 10}
          width={SHOP_W - 40}
          height={24}
          rx={3}
          className={live ? LIFT : undefined}
        />
        {/* Cửa sổ: khung, thanh chia, bệ */}
        <rect x={x + 20} y={winY} width={84} height={50} rx={2} />
        {live && (
          // Lớp sáng của cửa sổ: tiệm tô đặc dùng màu nền để vẫn thấy được
          <rect
            x={x + 20}
            y={winY}
            width={84}
            height={50}
            rx={2}
            stroke="none"
            className={`${GLOW} ${hl ? "fill-page-bg" : "fill-current"}`}
          />
        )}
        <path
          d={`M${x + 62} ${winY} V${winY + 50} M${x + 16} ${winY + 50} H${x + 108}`}
        />
        {kind === "bakery" && (
          <path d={`M${x + 20} ${winY + 25} H${x + 104}`} />
        )}
        {/* Cửa ra vào + tay nắm */}
        <g className={live ? DOOR : undefined}>
          <rect x={doorX} y={doorTop} width={DOOR_W} height={72} rx={2} />
          <circle cx={doorX + DOOR_W - 8} cy={GROUND - 34} r={1.6} />
          {kind === "delivery" && (
            // Cửa cuốn: các vạch ngang nằm trên cánh cửa → co theo cửa khi hé
            <path
              d={[0, 1, 2, 3, 4]
                .map((k) => `M${doorX} ${doorTop + 10 + k * 12} h${DOOR_W}`)
                .join(" ")}
            />
          )}
        </g>
        {kind === "cafe" && (
          // Mái hiên vải có răng cưa
          <path
            d={
              `M${x + 12} ${t + 44} H${x + SHOP_W - 12} M${x + 12} ${t + 44} ` +
              `v4 ` +
              `q${sw / 2} 10 ${sw} 0 `.repeat(n)
            }
          />
        )}
        {kind === "store" && (
          <path
            d={`M${x} ${t + 44} H${x + SHOP_W} M${x} ${t + 50} H${x + SHOP_W}`}
          />
        )}
      </g>
      <text
        x={x + SHOP_W / 2}
        y={t + 22.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        stroke="none"
        className={`${hl ? "fill-page-bg" : "fill-current"} ${live ? LIFT : ""}`}
        style={{ fontWeight: hl ? 600 : 400 }}
      >
        {sign}
      </text>

      {/* Vạch đỗ xe nét đứt và số thứ tự */}
      <path
        d={`M${x + 20} ${GROUND + 14} H${x + SHOP_W - 20}`}
        strokeDasharray="6 8"
      />
      <text
        x={x + SHOP_W / 2}
        y={GROUND + 38}
        textAnchor="middle"
        fontSize={12}
        stroke="none"
        fill="currentColor"
        opacity={0.7}
      >
        {String(i + 1).padStart(2, "0")}
      </text>
    </g>
  );
}

/**
 * Section ②b — con phố nét mảnh, một người bước ra từ tiệm Workmate rồi đi dạo qua các tiệm.
 * Chỉ trang trí (aria-hidden), không có nút/thẻ. Vẽ bằng currentColor nên tự đổi màu theo theme;
 * chuyển động chỉ transform/opacity.
 */
export default function StreetSceneSection() {
  const ref = useRef<HTMLElement>(null);
  const personRef = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();
  const live = useMediaQuery(FINE_POINTER);

  useGSAP(
    () => {
      const person = personRef.current;
      if (reduced || !person) return; // giảm chuyển động → người đứng yên cạnh cửa Workmate
      // Hai lớp (viền nền + nét) cùng được cập nhật tư thế
      const rig = Array.from(
        person.querySelectorAll<SVGGElement>("[data-rig]"),
      );
      const apply = (p: Pose) =>
        rig.forEach((el) =>
          el.setAttribute("transform", p[el.dataset.rig as string]),
        );

      const walk = { ph: 0 };
      const cycles = (WALK_END - WALK_START) / STRIDE;
      gsap.set(person, { x: WALK_START, opacity: 0 });
      // Đi liên tục, không dừng: x tuyến tính, chu kỳ bước khớp quãng đường; mờ vào lúc ra cửa, mờ ra gần mép phải
      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.4,
        paused: true,
        defaults: { ease: "none" },
      });
      tl.to(person, { x: WALK_END, duration: TRAVEL }, 0)
        .to(person, { opacity: 1, duration: 0.8 }, 0)
        .to(person, { opacity: 0, duration: 1.2 }, TRAVEL - 1.2)
        .to(
          walk,
          {
            ph: cycles,
            duration: TRAVEL,
            onUpdate: () => apply(pose(walk.ph % 1)),
          },
          0,
        );
      // Chỉ chạy khi section nằm trong khung nhìn
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top 95%",
        end: "bottom 5%",
        onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    // Nền theo hiệu ứng đổi màu của cả trang (liền mạch, không thành dải cắt ngang).
    // Cùng theme đen ấm (night) với banner và Việc gấp nên không phải điểm giao; sang ngà do FeatureBlocksSection lo.
    <section
      ref={ref}
      data-theme="night"
      className="relative z-10 py-10 md:py-14"
    >
      <div className="shell">
        <svg
          aria-hidden
          viewBox="0 0 1200 252"
          preserveAspectRatio="xMinYMid slice"
          className="block h-auto min-h-[136px] w-full overflow-hidden text-page-fg md:min-h-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          fontFamily="inherit"
        >
          {/* Mặt trời (tia đều) và mây */}
          <circle cx={1150} cy={44} r={13} />
          <path d="M1150 22 v-6 M1150 66 v6 M1128 44 h-6 M1172 44 h6 M1134 28 l-4 -4 M1166 28 l4 -4 M1134 60 l-4 4 M1166 60 l4 4" />
          <Cloud x={390} y={40} />
          <Cloud x={800} y={36} />

          {/* Dừa cao hơn mái, đứng ở khe giữa tiệm */}
          <Palm x={236} h={160} />
          <Palm x={656} h={168} />
          <Palm x={1086} h={146} />

          {SHOPS.map((s, i) => (
            <Shop key={s.sign} i={i} live={live} />
          ))}

          {/* Đèn đường ở hai khe còn trống, và vài chú chim nhỏ */}
          {[450, 870].map((lx) => (
            <path
              key={lx}
              d={`M${lx} ${GROUND} V84 M${lx - 6} 84 h12 l-2 -6 h-8 z`}
            />
          ))}
          <path d="M300 30 q3 -3 6 0 q3 -3 6 0 M320 40 q3 -3 6 0 q3 -3 6 0 M958 28 q3 -3 6 0 q3 -3 6 0" />

          {/* Mặt đường */}
          <path d={`M0 ${GROUND} H1200`} />

          {/* Người đi bộ: hai lớp — viền dày màu nền bên dưới để vẫn nổi trên mặt tiệm tô đặc */}
          <g ref={personRef} transform={`translate(${REST_X} ${GROUND})`}>
            <Walker className="text-page-bg" strokeWidth={4} />
            <Walker />
          </g>
        </svg>
      </div>
    </section>
  );
}

/**
 * Hình người nhìn nghiêng sang phải, chia khớp (data-rig) để xoay quanh hông/vai/gối/cổ chân/khuỷu.
 * Mặc định đứng nghiêm. Thân và chi tô màu nền (che chi phía sau); tóc và tay áo/bàn tay chấm đặc.
 * Thứ tự vẽ: chi xa → ba lô → thân → đầu → chi gần.
 */
function Walker({
  className,
  strokeWidth,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  const leg = (side: "L" | "R") => (
    <g data-rig={`leg${side}`} transform={STILL[`leg${side}`]}>
      {/* Ống quần: đùi + cẳng chân, rộng ~6 */}
      <rect x={-3.2} y={-1} width={6.4} height={THIGH + 2} rx={2.5} />
      <g data-rig={`shin${side}`} transform={STILL[`shin${side}`]}>
        <rect x={-2.7} y={-1} width={5.4} height={SHIN + 1} rx={2} />
        {/* Giày: xoay tại cổ chân, có đế */}
        <g data-rig={`foot${side}`} transform={STILL[`foot${side}`]}>
          <path d="M-2.6 -0.5 V1.4 L-3.2 3 H6 Q7.8 3 7 1.7 Q4 1.3 2.8 -0.5 Z" />
        </g>
      </g>
    </g>
  );
  const arm = (side: "L" | "R") => (
    <g data-rig={`arm${side}`} transform={STILL[`arm${side}`]}>
      {/* Tay áo ngắn, cẳng tay trần, bàn tay là chấm */}
      <rect x={-2.3} y={-1.8} width={4.6} height={ARM + 1.8} rx={2.3} />
      <g data-rig={`fore${side}`} transform={STILL[`fore${side}`]}>
        <path d={`M0 0 V${FORE - 1}`} />
        <circle cx={0} cy={FORE} r={1.4} fill="currentColor" />
      </g>
    </g>
  );
  return (
    <g className={`fill-page-bg ${className ?? ""}`} strokeWidth={strokeWidth}>
      <g data-rig="body" transform={STILL.body}>
        {arm("R")}
        {leg("R")}
        {/* Ba lô sau lưng + quai đeo qua vai */}
        <g data-rig="bag" transform={STILL.bag}>
          <rect x={-11} y={-16} width={7} height={12} rx={2.5} />
        </g>
        {/* Áo: thân hơi rộng, vai tròn, cổ chữ V */}
        <path
          d={`M-4.6 0 L-5.2 -${TORSO - 3} Q-5.2 -${TORSO} -2.6 -${TORSO} H2.6 Q5.2 -${TORSO} 5.2 -${TORSO - 3} L4.6 0 Z`}
        />
        <path d={`M-2.2 -${TORSO} Q0 -${TORSO - 3} 2.2 -${TORSO}`} />
        <path d={`M1.2 -${TORSO - 0.5} Q3.2 -9 -4.6 -5`} fill="none" />
        {/* Cổ + đầu có hóc mũi, mắt, tóc ngắn */}
        <path d={`M0 -${TORSO} V-${TORSO + 3}`} fill="none" />
        <circle cx={0} cy={-(TORSO + 9.5)} r={6.5} />
        <path d={`M6.4 -${TORSO + 10.5} l2 2.2 l-2.2 0.8`} fill="none" />
        <circle
          cx={3.2}
          cy={-(TORSO + 10)}
          r={0.7}
          fill="currentColor"
          stroke="none"
        />
        <path
          d={`M-6.4 -${TORSO + 8} Q-7.4 -${TORSO + 17} 0 -${TORSO + 16} Q5.4 -${TORSO + 16} 6.2 -${TORSO + 12} Q2 -${TORSO + 12.8} -1 -${TORSO + 11} Q-4 -${TORSO + 10} -6.4 -${TORSO + 8} Z`}
          fill="currentColor"
        />
        {leg("L")}
        {arm("L")}
      </g>
    </g>
  );
}
