import { useEffect, useRef, useState } from 'react'

import { ScrollTrigger } from '@utils/gsap'
import { getSmoothScroll } from '@hooks/useSmoothScroll'
import { useExperienceStore, type Quality } from '@context/experienceStore'
import { markParticlesFailed } from '@components/motion/particleStatus'
import tokens from '@/styles/tokens.json'

// ───────────────────────── Thông số tinh chỉnh ─────────────────────────

/** Số hạt theo chất lượng (màn < 640px luôn dùng mức thấp). */
const PARTICLES = { high: 13000, low: 4500 }
/** Giới hạn DPR và FPS theo chất lượng. */
const SETTINGS: Record<Quality, { maxDpr: number; fps: number }> = {
  high: { maxDpr: 1.5, fps: 60 },
  low: { maxDpr: 1.5, fps: 30 },
}
/** Kích thước điểm (CSS px): logo / nền tan (nhỏ nhất → lớn nhất theo độ sâu). */
const SIZE_LOGO = 2.4
/** Bề rộng logo hạt: màn rộng = LOGO_WIDTH_RATIO × vw tối đa LOGO_WIDTH_MAX; màn hẹp (< 640px) = LOGO_WIDTH_NARROW × vw. Hạt nhỏ hơn ở màn hẹp. */
const LOGO_WIDTH_RATIO = 0.65
const LOGO_WIDTH_MAX = 850
const LOGO_WIDTH_NARROW = 0.68
const SIZE_LOGO_NARROW = 1.5
const SIZE_SCATTER: [number, number] = [1, 1.7]
/** Nền tan kiểu tinh vân: số đám, bề rộng gaussian của đám (theo tỉ lệ viewport), phần hạt rải đều, và tỉ lệ hạt còn hiện khi đã tan. */
const CLOUD_COUNT: [number, number] = [6, 10]
const CLOUD_SIGMA: [number, number] = [0.05, 0.2]
const CLOUD_UNIFORM = 0.12
const SCATTER_KEEP = 0.25
/** Độ đục: logo / nền tan (theo độ sâu). */
const ALPHA_LOGO = 1.0
const ALPHA_SCATTER: [number, number] = [0.38, 0.55]
/** Chuột: bán kính ảnh hưởng (CSS px), tốc độ bám của vị trí, tốc độ bật/tắt lực (lần/giây). */
const MOUSE_RADIUS = 140
/** Dịch chuyển kiểu gaussian d·exp(−(d/R)²)·PUSH: tâm hầu như đứng yên, tối đa ~0,43·PUSH·R quanh 0,7R, rồi tắt dần — loang chứ không khoét lỗ. */
const MOUSE_PUSH = 0.3
/** Thành phần xoáy (tiếp tuyến) so với thành phần đẩy ra. */
const MOUSE_SWIRL = 0.12
/** Hạt quanh con trỏ sáng lên: độ đục tại tâm khi đã tan, và phần phóng to thêm của điểm. */
const MOUSE_ALPHA = 0.6
const MOUSE_SIZE_BOOST = 0.6
/** Ở trạng thái logo: hạt gần con trỏ giảm độ đục nhẹ (1 = không đổi). */
const MOUSE_LOGO_DIM = 0.8
const MOUSE_FOLLOW = 14
const MOUSE_FORCE_RATE = 5
/** Tiến trình tụ/tan: tốc độ bám (lần/giây), và phần tiến trình dành cho độ trễ riêng của hạt. */
const PROGRESS_FOLLOW = 2.8
const STAGGER = 0.5
/** Hạt tan trải suốt chừng này phần chiều cao màn hình đầu tiên (logo header hiện ở 0,3 → 0,45, xem IntroHero). */
const INTRO_PHASE = 0.9
/** Hạt màu lavender: tỉ lệ ở trạng thái logo / khi tan; khi tan pha với màu chữ trang theo tỉ lệ này (nền sáng vẫn thấy được). */
const ACCENT_LOGO_SHARE = 0.25
/** Khi tan trên nền tối: ~42% hạt mang màu nhấn nguyên chất, to hơn ACCENT_SIZE lần và đục hơn (ACCENT_ALPHA). */
const ACCENT_SCATTER_SHARE = 0.42
const ACCENT_SIZE = 1.6
const ACCENT_ALPHA = 0.9
/** Cơ cấu nhóm hạt màu: violet, lavender, ice, blush, ember. */
const ACCENT_WEIGHTS = [0.3, 0.2, 0.22, 0.18, 0.1]
/** Nền được coi là tối (hạt màu hiện) khi độ sáng --page-bg dưới ngưỡng này, hoặc đang ở banner tối. */
const DARK_LUMA = 0.35
/** Ở intro: hạt bắt đầu mờ đi khi tiến trình tan vượt mốc này, tan xong thì ẩn hẳn (banner không có hạt). */
const SHOW_FADE_FROM = 0.55
/** Lấp lánh: hạt nào cũng sáng tối chậm ±TWINKLE; SPARKLE_SHARE hạt thỉnh thoảng "lóe" (đỉnh nhọn ngắn) — alpha lên 1, to gấp FLASH_SIZE; ở logo lóe nhẹ hơn (FLASH_LOGO) để chữ không nhấp nháy loạn. */
const TWINKLE = 0.25
const SPARKLE_SHARE = 0.07
const FLASH_SIZE = 2
const FLASH_LOGO = 0.4
/** Logo "thở": biên độ rung quanh vị trí đích (CSS px); phần hạt lơ lửng quanh viền logo và tầm lệch, độ đục của chúng. Màn hẹp nhân LOGO_NARROW_SCALE. */
const LOGO_JITTER = 3.5
/** Tốc độ dao động của logo và tốc độ trôi quanh viền của hạt lơ lửng (hệ số nhân). */
const LOGO_SPEED = 1.5
const HALO_SPEED = 0.6
const HALO_FRACTION = 0.12
const HALO_RANGE: [number, number] = [10, 48]
/** Độ đục hạt quầng: sát viền → xa nhất. */
const HALO_ALPHA = 0.6
const HALO_ALPHA_FAR = 0.15
const LOGO_NARROW_SCALE = 0.6
/** Làm mượt vận tốc cuộn / vị trí cuộn cho parallax (lần/giây). */
const VELOCITY_FOLLOW = 6
const SCROLL_FOLLOW = 5
/** Độ lệch parallax so với cuộn (hạt gần nhất = 1). */
const PARALLAX = 0.4
/** Khi cuộn: hạt dịch thêm theo chiều cuộn = vận tốc × độ sâu × hệ số này (tối đa ~60px), biên độ trôi tăng theo |vận tốc|, và hạt to/sáng thêm tối đa VEL_BOOST khi cuộn nhanh. Dừng cuộn thì tự êm dần (vận tốc được làm mượt). */
const VEL_SHIFT = 1
const VEL_DRIFT = 0.8
const VEL_BOOST = 0.4
/** Biên độ (CSS px) và tốc độ (hệ số nhân) trôi chậm của hạt đã tan. */
const DRIFT = 22
const DRIFT_SPEED = 1.8
/** Chữ nền đổi màu mượt (lần/giây) và chu kỳ đọc --page-fg (ms). */
const COLOR_FOLLOW = 4
const COLOR_POLL_MS = 250
/** Đổi chiều cao viewport quá ngưỡng này (thanh địa chỉ thì không) mới lấy mẫu lại logo. */
const HEIGHT_REBUILD = 0.25
/** Mất context quá số lần này, hoặc không khôi phục trong chừng ms → coi là hỏng. */
const MAX_CONTEXT_LOSSES = 2
const RESTORE_TIMEOUT_MS = 3000

// ───────────────────────── Shader ─────────────────────────

const VERTEX = `
precision highp float;
attribute vec2 aLogo;     // vị trí đích khi thành logo (CSS px, gốc trái-trên)
attribute vec2 aScatter;  // vị trí khi tan (0..1 theo viewport)
attribute vec4 aSeed;     // x: độ sâu 0.3..1, y: độ trễ 0..1, z: pha trôi, w: ngẫu nhiên
uniform vec2 uRes;        // viewport CSS px
uniform float uDpr;
uniform float uP;         // 0 = logo, 1 = tan
uniform float uTime;
uniform float uScroll;    // vị trí cuộn đã làm mượt (px)
uniform float uVel;       // vận tốc cuộn đã làm mượt (px/khung)
uniform vec2 uMouse;
uniform float uMouseForce;
uniform float uMouseR;
uniform float uMousePush;
uniform float uMouseSwirl;
uniform float uMouseAlpha;
uniform float uMouseSize;
uniform float uMouseLogoDim;
uniform vec3 uAccent[5];     // violet, lavender, ice, blush, ember
uniform float uAccentLogoShare;
uniform float uAccentScatterShare;
uniform vec4 uAccentCum;     // tỉ lệ cộng dồn 4 màu đầu trong nhóm (màu thứ 5 là phần còn lại)
uniform float uAccentAmount; // 0 = nền sáng (đơn sắc) .. 1 = nền tối (đủ màu)
uniform float uShow;         // 0 = ẩn hẳn lớp hạt (banner, nền sáng) .. 1 = hiện
uniform float uAccentSize;
uniform float uAccentAlpha;
uniform float uTwinkle;
uniform float uSparkle;
uniform float uFlashSize;
uniform float uFlashLogo;
uniform float uLogoJitter;
uniform float uHalo;
uniform vec2 uHaloRange;
uniform float uHaloAlpha;
uniform float uHaloAlphaFar;
uniform float uKeep;
uniform vec3 uColLogo;
uniform vec3 uColScatter;
uniform float uSizeLogo;
uniform vec2 uSizeScatter;
uniform float uAlphaLogo;
uniform vec2 uAlphaScatter;
uniform float uParallax;
uniform float uDrift;
uniform float uDriftSpeed;
uniform float uLogoSpeed;
uniform float uHaloSpeed;
uniform float uVelShift;
uniform float uVelDrift;
uniform float uVelBoost;
uniform float uStagger;
varying float vAlpha;
varying vec3 vCol;
varying float vFlash;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 accentAt(float k) {
  if (k < uAccentCum.x) return uAccent[0];
  if (k < uAccentCum.y) return uAccent[1];
  if (k < uAccentCum.z) return uAccent[2];
  if (k < uAccentCum.w) return uAccent[3];
  return uAccent[4];
}

float easeInOut(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
}

void main() {
  float depth = aSeed.x;
  float dn = (depth - 0.3) / 0.7;

  // Mỗi hạt có độ trễ riêng nên tan/tụ lần lượt thay vì cùng lúc
  float t = clamp((uP - aSeed.y * uStagger) / (1.0 - uStagger), 0.0, 1.0);
  float e = easeInOut(t);

  // Trôi chậm theo thời gian; cuộn nhanh thì biên độ tăng nhẹ
  float av = min(abs(uVel), 60.0);
  float amp = (uDrift + av * uVelDrift) * depth;
  float tt = uTime * uDriftSpeed;
  vec2 drift = vec2(
    sin(tt * 0.21 + aSeed.z * 6.2831),
    cos(tt * 0.17 + aSeed.z * 12.566 + aSeed.w * 3.0)
  ) * amp;

  // Parallax dọc theo độ sâu, bọc vòng để luôn phủ kín màn hình
  vec2 sc = aScatter * uRes;
  float h = uRes.y + 160.0;
  sc.y = mod(sc.y - uScroll * depth * uParallax - uVel * depth * uVelShift + 80.0, h) - 80.0;

  // Phân loại hạt theo seed cố định (không cần buffer thêm): tím hay ngà, có lơ lửng quanh viền hay không
  float h1 = hash(aSeed.zw);
  float h2 = hash(aSeed.zw + vec2(1.7, 3.1));
  float h3 = hash(aSeed.zw + vec2(5.3, 0.7));
  float halo = step(h2, uHalo);

  // Logo "thở": mỗi hạt rung chậm quanh đích; hạt lơ lửng thì trôi xa hơn quanh viền
  float ph = aSeed.z * 6.2831;
  float sp = (0.35 + h3 * 0.6) * uLogoSpeed;
  vec2 logoPos = aLogo + vec2(sin(uTime * sp + ph), cos(uTime * sp * 0.83 + ph * 1.7)) * uLogoJitter;
  float ha = h3 * 6.2831 + uTime * uHaloSpeed * (h1 - 0.5);
  float rr = fract(h1 * 7.0 + h3);
  float hr = mix(uHaloRange.x, uHaloRange.y, rr) * (1.0 + 0.25 * sin(uTime * 0.5 + ph));
  logoPos += vec2(cos(ha), sin(ha)) * hr * halo;

  vec2 pos = mix(logoPos, sc + drift, e);

  // Chuột: dịch chuyển gaussian d·exp(−(d/R)²) cộng xoáy nhẹ — tâm gần như đứng yên, lực tắt
  // dần ra ngoài nên không có vành hạt đặc. Mỗi hạt lệch ngẫu nhiên về tầm và độ lớn.
  float rv = aSeed.w;
  vec2 d = pos - uMouse;
  float dist = length(d) + 0.001;
  float s = dist / (uMouseR * (1.0 + (rv - 0.5) * 0.3));
  float w = exp(-s * s);
  float wob = 1.0 + 0.15 * sin(uTime * 1.5 + aSeed.z * 20.0);
  vec2 push = (d + uMouseSwirl * vec2(-d.y, d.x)) * w * uMousePush * (0.6 + 0.8 * rv) * wob;
  pos += push * uMouseForce;
  float lit = w * uMouseForce;

  // Lấp lánh: sáng tối chậm theo pha riêng + một phần hạt thỉnh thoảng lóe (đỉnh nhọn, không đồng loạt)
  float isAcc = step(h1, uAccentScatterShare) * uAccentAmount; // hạt màu khi tan, theo mức nền tối
  float twinkle = 1.0 + uTwinkle * sin(uTime * (0.4 + h3 * 0.8) + ph * 3.0);
  float isSpark = step(hash(aSeed.zw + vec2(3.7, 8.1)), uSparkle);
  float flash = isSpark * pow(max(0.0, sin(uTime * (0.25 + h2 * 0.5) + h1 * 40.0)), 12.0) * mix(uFlashLogo, 1.0, e);
  vFlash = flash;

  gl_Position = vec4(pos.x / uRes.x * 2.0 - 1.0, 1.0 - pos.y / uRes.y * 2.0, 0.0, 1.0);
  gl_PointSize = mix(uSizeLogo, mix(uSizeScatter.x, uSizeScatter.y, dn), e) * (1.0 + uMouseSize * lit * e + uVelBoost * av / 60.0 * e) * (1.0 + (uFlashSize - 1.0) * flash) * (1.0 + (uAccentSize - 1.0) * isAcc * e) * uDpr;
  float a0 = mix(uAlphaLogo * mix(1.0, mix(uHaloAlpha, uHaloAlphaFar, rr), halo), mix(mix(uAlphaScatter.x, uAlphaScatter.y, dn), uAccentAlpha, isAcc), e);
  // Gần con trỏ: khi đã tan thì sáng lên; ở logo thì giảm nhẹ
  float aLit = mix(a0 * uMouseLogoDim, max(a0, uMouseAlpha), e);
  // Khi đã tan chỉ một phần hạt còn hiện (chọn theo seed cố định), phần còn lại mờ dần theo e
  float keep = step(hash(aSeed.zw + vec2(9.1, 2.3)), uKeep);
  float al = min(1.0, mix(a0, aLit, lit) * (1.0 + uVelBoost * av / 60.0 * e) * twinkle);
  vAlpha = mix(al, 1.0, flash) * mix(1.0, keep, e) * uShow;
  // Màu: ngà (logo) / màu nền (tan), một phần hạt mang màu nhấn theo seed cố định
  vec3 colLogo = uColLogo;
  if (h1 < uAccentLogoShare) colLogo = accentAt(h1 / uAccentLogoShare);
  vec3 colScatter = uColScatter;
  if (h1 < uAccentScatterShare) colScatter = mix(uColScatter, accentAt(h1 / uAccentScatterShare), uAccentAmount);
  vCol = mix(colLogo, colScatter, e);
}
`

const FRAGMENT = `
precision mediump float;
varying float vAlpha;
varying vec3 vCol;
varying float vFlash;
void main() {
  float r = length(gl_PointCoord - 0.5);
  // Hạt đang lóe: lõi sáng + quầng mềm
  float glow = vFlash * (1.0 - smoothstep(0.0, 0.5, r)) * 0.7 * step(0.001, vAlpha);
  float a = min(1.0, vAlpha * (1.0 - smoothstep(0.3, 0.5, r)) + glow);
  gl_FragColor = vec4(vCol * a, a); // alpha nhân sẵn
}
`

// ───────────────────────── Tiện ích ─────────────────────────

type RGB = [number, number, number]

/** Hex hoặc rgb()/rgba() → [0..1]. Không đọc được thì trả null. */
function parseColor(input: string): RGB | null {
  const s = input.trim()
  const hex = /^#([0-9a-f]{6})$/i.exec(s)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s)
  return m ? [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255] : null
}

const IVORY = parseColor(tokens.palette.ivory) as RGB
/** Ba màu nhấn chỉ dùng cho lớp hạt: lavender, ice, blush (xem DESIGN.md). */
const ACCENTS = [tokens.palette.violet, tokens.palette.lavender, tokens.palette.ice, tokens.palette.blush, tokens.palette.ember].map((c) => parseColor(c) as RGB)

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[ParticleField]', gl.getShaderInfoLog(shader))
    return null
  }
  return shader
}

/** Briefcase của lucide-react 0.400: 1 path + 1 rect (x2 y6 w20 h14 rx2), viewBox 24. */
const BRIEFCASE = [
  new Path2D('M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'),
  new Path2D('M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'),
]

/** Mật độ lấy mẫu: 1 CSS px = SAMPLE px trên canvas ẩn (mịn hơn để viền chữ gọn). */
const SAMPLE = 2

/**
 * Vẽ logo (icon + chữ, đúng bố cục `flex items-center gap-2` của header) lên canvas ẩn,
 * phóng cho bề rộng bằng logo intro, căn giữa viewport; trả về các điểm (CSS px) nằm trong nét.
 * Các số 20 / 8 / 28 khớp logo header: icon `w-5 h-5` = 20, `gap-2` = 8, `text-xl` cao dòng 28.
 * Hộp lấy mẫu tính từ số đo thật của chữ + icon, có đệm rộng nên không nét nào chạm mép.
 */
function sampleLogo(vw: number, vh: number): Float32Array {
  const logoEl = document.querySelector<HTMLElement>('[data-brand-logo]')
  const cs = logoEl ? getComputedStyle(logoEl) : null
  const fontSize = 20 // text-xl
  const family = cs?.fontFamily || 'sans-serif'
  const letterSpacing = cs && cs.letterSpacing !== 'normal' ? cs.letterSpacing : `${-0.025 * fontSize}px`

  const measure = document.createElement('canvas').getContext('2d')!
  const font = `600 ${fontSize}px ${family}`
  measure.font = font
  if ('letterSpacing' in measure) measure.letterSpacing = letterSpacing
  measure.textBaseline = 'alphabetic'
  const m = measure.measureText('Workmate')

  // Dòng cao 28, chữ căn giữa dòng: baseline = giữa dòng + (ascent − descent) / 2
  const natH = 28
  const fontAsc = m.fontBoundingBoxAscent ?? fontSize * 0.8
  const fontDesc = m.fontBoundingBoxDescent ?? fontSize * 0.2
  const baseline = natH / 2 + (fontAsc - fontDesc) / 2
  const textL = 28
  const textR = textL + Math.max(m.width, m.actualBoundingBoxRight)
  const textT = baseline - m.actualBoundingBoxAscent
  const textB = baseline + m.actualBoundingBoxDescent
  // Icon 20×20 ở giữa dòng; nét 2/24 tràn ra ngoài 1 đơn vị lưới
  const iconPad = 1
  const iconT = (natH - 20) / 2 - iconPad
  const iconB = iconT + 20 + 2 * iconPad

  const boxL = -iconPad
  const boxR = textR
  const boxT = Math.min(textT, iconT)
  const boxB = Math.max(textB, iconB)
  const boxW = boxR - boxL
  const boxH = boxB - boxT

  const targetW = vw < 640 ? vw * LOGO_WIDTH_NARROW : Math.min(vw * LOGO_WIDTH_RATIO, LOGO_WIDTH_MAX)
  const scale = targetW / textR // bề rộng logo = icon + gap + chữ
  const pad = 8 // CSS px đệm quanh hộp
  const w = Math.ceil(boxW * scale) + pad * 2
  const h = Math.ceil(boxH * scale) + pad * 2

  const cv = document.createElement('canvas')
  cv.width = w * SAMPLE
  cv.height = h * SAMPLE
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  ctx.setTransform(SAMPLE, 0, 0, SAMPLE, 0, 0)
  ctx.translate(pad, pad)
  ctx.scale(scale, scale)
  ctx.translate(-boxL, -boxT)
  ctx.fillStyle = 'black'
  ctx.strokeStyle = 'black'

  // Icon: lưới 24 thu về 20, đặt giữa dòng
  ctx.save()
  ctx.translate(0, (natH - 20) / 2)
  ctx.scale(20 / 24, 20 / 24)
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const p of BRIEFCASE) ctx.stroke(p)
  ctx.restore()

  // Chữ
  ctx.font = font
  if ('letterSpacing' in ctx) ctx.letterSpacing = letterSpacing
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('Workmate', textL, baseline)

  const data = ctx.getImageData(0, 0, cv.width, cv.height).data
  const hits: number[] = []
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) hits.push((i - 3) / 4)

  // Toạ độ trong viewport: hộp lấy mẫu đặt giữa màn hình
  const ox = vw / 2 - w / 2
  const oy = vh / 2 - h / 2
  const out = new Float32Array(hits.length * 2)
  for (let i = 0; i < hits.length; i++) {
    out[i * 2] = ox + (hits[i] % cv.width) / SAMPLE
    out[i * 2 + 1] = oy + Math.floor(hits[i] / cv.width) / SAMPLE
  }
  return out
}

// ───────────────────────── Component ─────────────────────────

/**
 * Lớp hạt WebGL toàn trang chủ: ở intro hàng nghìn hạt ghép thành logo Workmate; cuộn
 * xuống thì tan ra làm nền mờ kín đáo cho cả trang; cuộn về đầu lại tụ thành logo.
 * Chuột đẩy hạt ở mọi trạng thái. Toàn bộ chuyển động nằm trong vertex shader, JS chỉ
 * cập nhật vài uniform mỗi khung và KHÔNG đọc DOM trong vòng vẽ.
 *
 * Mọi đường hỏng (không context, shader lỗi, không lấy được điểm, mất context không khôi
 * phục) đều gọi markParticlesFailed → IntroHero quay về tween logo bay, logo không biến mất.
 *
 * Nằm dưới header (z-40) và dưới nội dung các section (relative z-10), trên nền trang và banner hero; không nhận chuột.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const quality = useExperienceStore((s) => s.quality)
  // Tăng khi context được khôi phục → canvas mới, dựng lại toàn bộ
  const [generation, setGeneration] = useState(0)
  const losses = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true })
    if (!gl) {
      markParticlesFailed()
      return
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    const program = gl.createProgram()!
    const releaseGl = () => {
      gl.deleteProgram(program)
      if (vs) gl.deleteShader(vs)
      if (fs) gl.deleteShader(fs)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
    if (vs && fs) {
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
    }
    if (!vs || !fs || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (vs && fs) console.warn('[ParticleField]', gl.getProgramInfoLog(program))
      releaseGl()
      markParticlesFailed()
      return
    }
    gl.useProgram(program)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)

    const settings = SETTINGS[quality]
    const u = (name: string) => gl.getUniformLocation(program, name)
    const uni = {
      res: u('uRes'), dpr: u('uDpr'), p: u('uP'), time: u('uTime'), scroll: u('uScroll'), vel: u('uVel'),
      mouse: u('uMouse'), mouseForce: u('uMouseForce'), colScatter: u('uColScatter'), accentAmount: u('uAccentAmount'), show: u('uShow'), sizeLogo: u('uSizeLogo'), logoJitter: u('uLogoJitter'),
    }
    gl.uniform1f(u('uMouseR'), MOUSE_RADIUS)
    gl.uniform1f(u('uMousePush'), MOUSE_PUSH)
    gl.uniform1f(u('uMouseSwirl'), MOUSE_SWIRL)
    gl.uniform1f(u('uMouseAlpha'), MOUSE_ALPHA)
    gl.uniform1f(u('uMouseSize'), MOUSE_SIZE_BOOST)
    gl.uniform1f(u('uMouseLogoDim'), MOUSE_LOGO_DIM)
    gl.uniform3fv(u('uAccent[0]'), ACCENTS.flat())
    gl.uniform1f(u('uAccentLogoShare'), ACCENT_LOGO_SHARE)
    gl.uniform1f(u('uAccentScatterShare'), ACCENT_SCATTER_SHARE)
    gl.uniform4f(
      u('uAccentCum'),
      ACCENT_WEIGHTS[0],
      ACCENT_WEIGHTS[0] + ACCENT_WEIGHTS[1],
      ACCENT_WEIGHTS[0] + ACCENT_WEIGHTS[1] + ACCENT_WEIGHTS[2],
      ACCENT_WEIGHTS[0] + ACCENT_WEIGHTS[1] + ACCENT_WEIGHTS[2] + ACCENT_WEIGHTS[3],
    )
    gl.uniform1f(u('uAccentSize'), ACCENT_SIZE)
    gl.uniform1f(u('uAccentAlpha'), ACCENT_ALPHA)
    gl.uniform1f(u('uTwinkle'), TWINKLE)
    gl.uniform1f(u('uSparkle'), SPARKLE_SHARE)
    gl.uniform1f(u('uFlashSize'), FLASH_SIZE)
    gl.uniform1f(u('uFlashLogo'), FLASH_LOGO)
    gl.uniform1f(u('uHalo'), HALO_FRACTION)
    gl.uniform2f(u('uHaloRange'), ...HALO_RANGE)
    gl.uniform1f(u('uHaloAlpha'), HALO_ALPHA)
    gl.uniform1f(u('uHaloAlphaFar'), HALO_ALPHA_FAR)
    gl.uniform1f(u('uKeep'), SCATTER_KEEP)
    gl.uniform3f(u('uColLogo'), ...IVORY)
    gl.uniform2f(u('uSizeScatter'), ...SIZE_SCATTER)
    gl.uniform1f(u('uAlphaLogo'), ALPHA_LOGO)
    gl.uniform2f(u('uAlphaScatter'), ...ALPHA_SCATTER)
    gl.uniform1f(u('uParallax'), PARALLAX)
    gl.uniform1f(u('uDrift'), DRIFT)
    gl.uniform1f(u('uDriftSpeed'), DRIFT_SPEED)
    gl.uniform1f(u('uLogoSpeed'), LOGO_SPEED)
    gl.uniform1f(u('uHaloSpeed'), HALO_SPEED)
    gl.uniform1f(u('uVelShift'), VEL_SHIFT)
    gl.uniform1f(u('uVelDrift'), VEL_DRIFT)
    gl.uniform1f(u('uVelBoost'), VEL_BOOST)
    gl.uniform1f(u('uStagger'), STAGGER)

    // Hai buffer: logo (đổi khi lấy mẫu lại) và scatter+seed
    const logoBuf = gl.createBuffer()
    const seedBuf = gl.createBuffer()
    const aLogo = gl.getAttribLocation(program, 'aLogo')
    const aScatter = gl.getAttribLocation(program, 'aScatter')
    const aSeed = gl.getAttribLocation(program, 'aSeed')

    let count = 0
    // Dữ liệu ngẫu nhiên giữ nguyên qua các lần lấy mẫu lại: x, y (0..1), độ sâu, ngẫu nhiên, pha
    let base = new Float32Array(0)
    // Kích thước "ổn định": bề rộng theo viewport, chiều cao chỉ đổi khi lệch > HEIGHT_REBUILD
    // (thanh địa chỉ điện thoại ẩn/hiện không làm hạt nhảy). Canvas cao đúng bằng chiều cao này.
    let cssW = window.innerWidth
    let cssH = window.innerHeight
    let dpr = 1
    let ready = false
    let cancelled = false

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, settings.maxDpr)
      canvas.style.height = `${cssH}px`
      const w = Math.max(1, Math.round(cssW * dpr))
      const h = Math.max(1, Math.round(cssH * dpr))
      if (w !== canvas.width || h !== canvas.height) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uni.res, cssW, cssH)
      gl.uniform1f(uni.dpr, dpr)
    }

    // Lấy mẫu logo rồi dựng lại hai buffer. Trả false nếu không có điểm nào.
    const build = () => {
      const narrow = cssW < 640
      const n = narrow ? PARTICLES.low : PARTICLES[quality]
      if (n !== count) {
        count = n
        base = new Float32Array(n * 5)
        // Vị trí tan không đều: vài đám gaussian rộng hẹp khác nhau + một phần rải đều cho khỏi trống hẳn
        const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
        const clouds = Array.from({ length: Math.round(rand(CLOUD_COUNT[0], CLOUD_COUNT[1] + 1)) }, () => ({
          x: Math.random(),
          y: Math.random(),
          sx: rand(CLOUD_SIGMA[0], CLOUD_SIGMA[1]),
          sy: rand(CLOUD_SIGMA[0], CLOUD_SIGMA[1]),
          w: 0.3 + Math.random(),
        }))
        const totalW = clouds.reduce((sum, c) => sum + c.w, 0)
        const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random())
        for (let i = 0; i < n; i++) {
          let x = Math.random()
          let y = Math.random()
          if (Math.random() > CLOUD_UNIFORM) {
            let pick = Math.random() * totalW
            const c = clouds.find((cl) => (pick -= cl.w) <= 0) ?? clouds[0]
            // Lấy lại nếu rơi ngoài viền; sau vài lần vẫn trượt thì giữ điểm rải đều
            for (let t = 0; t < 8; t++) {
              const gx = c.x + gauss() * c.sx
              const gy = c.y + gauss() * c.sy
              if (gx >= 0 && gx <= 1 && gy >= 0 && gy <= 1) {
                x = gx
                y = gy
                break
              }
            }
          }
          base[i * 5] = x
          base[i * 5 + 1] = y
          base[i * 5 + 2] = 0.3 + Math.random() * 0.7
          base[i * 5 + 3] = Math.random()
          base[i * 5 + 4] = Math.random()
        }
      }
      const pts = sampleLogo(cssW, cssH)
      const avail = pts.length / 2
      if (!avail) return false

      // Chọn ngẫu nhiên n điểm (xáo một phần); thiếu thì lặp lại kèm lệch nhẹ
      const idx = new Uint32Array(avail)
      for (let i = 0; i < avail; i++) idx[i] = i
      const pick = Math.min(n, avail)
      for (let i = 0; i < pick; i++) {
        const j = i + Math.floor(Math.random() * (avail - i))
        const tmp = idx[i]
        idx[i] = idx[j]
        idx[j] = tmp
      }

      const logo = new Float32Array(n * 2)
      // Bố trí seed: [scatterX, scatterY, depth, delay, phase, rand]
      const seed = new Float32Array(n * 6)
      const halfW = Math.min(cssW * (narrow ? 0.34 : 0.25), 310)
      for (let i = 0; i < n; i++) {
        const src = idx[i % pick]
        const dup = i >= pick
        const jx = (Math.random() - 0.5) / SAMPLE
        const jy = (Math.random() - 0.5) / SAMPLE
        const lx = pts[src * 2] + jx + (dup ? (Math.random() - 0.5) * 0.8 : 0)
        const ly = pts[src * 2 + 1] + jy + (dup ? (Math.random() - 0.5) * 0.8 : 0)
        logo[i * 2] = lx
        logo[i * 2 + 1] = ly
        // Độ trễ: nửa theo khoảng cách ngang tới tâm (tan từ giữa ra), nửa ngẫu nhiên
        const delay = 0.5 * base[i * 5 + 3] + 0.5 * Math.min(1, Math.abs(lx - cssW / 2) / halfW)
        seed[i * 6] = base[i * 5]
        seed[i * 6 + 1] = base[i * 5 + 1]
        seed[i * 6 + 2] = base[i * 5 + 2]
        seed[i * 6 + 3] = delay
        seed[i * 6 + 4] = base[i * 5 + 4]
        seed[i * 6 + 5] = base[i * 5 + 3]
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, logoBuf)
      gl.bufferData(gl.ARRAY_BUFFER, logo, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(aLogo)
      gl.vertexAttribPointer(aLogo, 2, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf)
      gl.bufferData(gl.ARRAY_BUFFER, seed, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(aScatter)
      gl.vertexAttribPointer(aScatter, 2, gl.FLOAT, false, 24, 0)
      gl.enableVertexAttribArray(aSeed)
      gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 24, 8)
      gl.uniform1f(uni.sizeLogo, narrow ? SIZE_LOGO_NARROW : SIZE_LOGO)
      gl.uniform1f(uni.logoJitter, LOGO_JITTER * (narrow ? LOGO_NARROW_SCALE : 1))
      gl.uniform2f(u('uHaloRange'), HALO_RANGE[0] * (narrow ? LOGO_NARROW_SCALE : 1), HALO_RANGE[1] * (narrow ? LOGO_NARROW_SCALE : 1))
      return true
    }

    // Tiến trình tụ/tan: theo cuộn trong intro (cùng khoảng logo cũ bay về header)
    const hero = document.querySelector<HTMLElement>('[data-home-hero]')
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
    let targetP = clamp01(window.scrollY / (window.innerHeight * INTRO_PHASE))
    let p = targetP
    const st = hero
      ? ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          end: () => '+=' + window.innerHeight * INTRO_PHASE,
          invalidateOnRefresh: true,
          onUpdate: (self) => (targetP = self.progress),
          onRefresh: (self) => (targetP = self.progress),
        })
      : null
    if (st) {
      targetP = st.progress
      p = targetP
    }

    // Chuột: chỉ khi có con trỏ chính xác
    const fine = window.matchMedia('(pointer: fine)').matches
    const mouseTarget = { x: -9999, y: -9999 }
    const mouse = { x: -9999, y: -9999 }
    let forceTarget = 0
    let force = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (forceTarget === 0 && force < 0.01) {
        mouse.x = e.clientX
        mouse.y = e.clientY
      }
      mouseTarget.x = e.clientX
      mouseTarget.y = e.clientY
      forceTarget = 1
    }
    const onLeave = () => (forceTarget = 0)
    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('mouseleave', onLeave)
      window.addEventListener('blur', onLeave)
    }

    // Màu nền sau khi tan: theo --page-fg; ngà khi banner ảnh tối còn chiếm hơn nửa màn hình.
    // "Banner chiếm bao nhiêu" tính từ vị trí cuộn và mốc đo sẵn (đầu phần 2), không đọc DOM
    // trong vòng vẽ; mốc đo lại khi ScrollTrigger refresh / resize.
    const root = document.documentElement
    let part2Top = 0 // toạ độ trang của mép trên phần 2
    const measure = () => {
      const next = hero?.nextElementSibling
      part2Top = next ? next.getBoundingClientRect().top + window.scrollY : 0
    }
    measure()
    ScrollTrigger.addEventListener('refresh', measure)

    let pageFg: RGB = IVORY
    let bgDark = true // nền trang (--page-bg) đang tối
    let accentAmount = 1
    let show = 1
    const color: RGB = [...IVORY]
    let lastPoll = -Infinity
    let lastPollY = NaN
    let lastScrollMove = -Infinity
    // --page-fg chuyển mượt bằng CSS sau khi cuộn dừng → tiếp tục đọc thêm ~1 giây
    const pollColor = (now: number, y: number) => {
      if (y !== lastPollY) lastScrollMove = now
      if (now - lastPoll < COLOR_POLL_MS || now - lastScrollMove > 1000) return
      lastPoll = now
      lastPollY = y
      const cs = getComputedStyle(root)
      pageFg = parseColor(cs.getPropertyValue('--page-fg')) ?? pageFg
      const bg = parseColor(cs.getPropertyValue('--page-bg'))
      if (bg) bgDark = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2] < DARK_LUMA
    }

    // Vòng vẽ
    let frame = 0
    let running = false
    let last = 0
    let scrollSmooth = window.scrollY
    let lastScrollY = window.scrollY
    let vel = 0
    const startTime = performance.now()
    const minDelta = 1000 / settings.fps - 2
    let timeNow = 0

    // Đẩy uniform hiện tại rồi vẽ (dùng cả cho vòng lặp lẫn vẽ ngay sau resize)
    const draw = () => {
      gl.uniform1f(uni.p, p)
      gl.uniform1f(uni.time, timeNow)
      gl.uniform1f(uni.scroll, scrollSmooth)
      gl.uniform1f(uni.vel, vel)
      gl.uniform2f(uni.mouse, mouse.x, mouse.y)
      gl.uniform1f(uni.mouseForce, force)
      gl.uniform3f(uni.colScatter, color[0], color[1], color[2])
      gl.uniform1f(uni.accentAmount, accentAmount)
      gl.uniform1f(uni.show, show)
      gl.clear(gl.COLOR_BUFFER_BIT)
      // Đang ẩn hẳn thì khỏi vẽ điểm nào
      if (ready && show > 0.002) gl.drawArrays(gl.POINTS, 0, count)
    }

    const loop = (now: number) => {
      if (document.hidden || cancelled) {
        running = false
        return
      }
      frame = requestAnimationFrame(loop)
      if (now - last < minDelta) return
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const k = (rate: number) => 1 - Math.exp(-dt * rate)

      if (!st) targetP = clamp01(window.scrollY / (window.innerHeight * INTRO_PHASE))
      p += (targetP - p) * k(PROGRESS_FOLLOW)
      if (Math.abs(targetP - p) < 0.0005) p = targetP

      // Vận tốc cuộn: Lenis nếu có, không thì chênh lệch scrollY mỗi khung (quy về 60fps)
      const y = window.scrollY
      const raw = getSmoothScroll()?.velocity ?? ((y - lastScrollY) / Math.max(dt, 0.001)) / 60
      lastScrollY = y
      vel += (Math.max(-60, Math.min(60, raw)) - vel) * k(VELOCITY_FOLLOW)
      scrollSmooth += (y - scrollSmooth) * k(SCROLL_FOLLOW)

      pollColor(now, y)
      const bannerDark = part2Top - y > cssH * 0.5
      const target = bannerDark ? IVORY : pageFg
      const kc = k(COLOR_FOLLOW)
      for (let i = 0; i < 3; i++) color[i] += (target[i] - color[i]) * kc
      // Hạt màu chỉ hiện trên nền tối: banner/intro hoặc --page-bg tối
      accentAmount += ((bannerDark || bgDark ? 1 : 0) - accentAmount) * kc
      // Hạt chỉ hiện ở: intro (logo rồi tan — mờ hẳn khi tan xong, banner ảnh hiện như bình thường)
      // và các phần nền tối phía dưới. Còn thấy banner (phần 2 chưa chạm mép trên) thì ẩn — lúc đó
      // nền trang còn đang chuyển từ graphite sang ngà, nếu không hạt sẽ lóe lên giữa chừng.
      const showTarget = bannerDark
        ? 1 - Math.min(1, Math.max(0, (p - SHOW_FADE_FROM) / (1 - SHOW_FADE_FROM)))
        : y < part2Top ? 0 : bgDark ? 1 : 0
      show += (showTarget - show) * (bannerDark ? 1 : kc)

      force += (forceTarget - force) * k(MOUSE_FORCE_RATE)
      mouse.x += (mouseTarget.x - mouse.x) * k(MOUSE_FOLLOW)
      mouse.y += (mouseTarget.y - mouse.y) * k(MOUSE_FOLLOW)

      timeNow = (now - startTime) / 1000
      draw()
    }
    const start = () => {
      if (running || cancelled) return
      running = true
      last = performance.now()
      frame = requestAnimationFrame(loop)
    }
    const onVisibility = () => {
      if (!document.hidden) start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Resize: bề rộng đổi hoặc chiều cao đổi > 25% mới đổi kích thước canvas + lấy mẫu lại logo
    // (sau khi ngừng kéo ~150ms). Canvas đổi cỡ thì vẽ lại ngay để không có khung trống.
    let debounce = 0
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w === cssW && Math.abs(h - cssH) / cssH <= HEIGHT_REBUILD) return
      cssW = w
      cssH = h
      resizeCanvas()
      draw()
      measure()
      window.clearTimeout(debounce)
      debounce = window.setTimeout(() => {
        if (cancelled) return
        if (!build()) {
          cancelled = true
          markParticlesFailed()
        }
      }, 150)
    }
    resizeCanvas()
    window.addEventListener('resize', onResize)

    // Mất context: dừng vẽ; khôi phục thì dựng lại bằng canvas mới. Mất quá nhiều lần hoặc
    // không khôi phục kịp → hỏng hẳn.
    let restoreTimer = 0
    const onLost = (e: Event) => {
      e.preventDefault()
      cancelled = true
      cancelAnimationFrame(frame)
      losses.current += 1
      if (losses.current > MAX_CONTEXT_LOSSES) {
        markParticlesFailed()
        return
      }
      restoreTimer = window.setTimeout(markParticlesFailed, RESTORE_TIMEOUT_MS)
    }
    const onRestored = () => {
      window.clearTimeout(restoreTimer)
      if (losses.current <= MAX_CONTEXT_LOSSES) setGeneration((g) => g + 1)
    }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    // Chờ font của logo tải xong mới lấy mẫu chữ — đây là lần lấy mẫu đầu tiên và duy nhất lúc mount
    void (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (cancelled) return
      ready = build()
      if (!ready) {
        cancelled = true
        markParticlesFailed()
        return
      }
      start()
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.clearTimeout(debounce)
      window.clearTimeout(restoreTimer)
      window.removeEventListener('resize', onResize)
      st?.kill()
      ScrollTrigger.removeEventListener('refresh', measure)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      gl.deleteBuffer(logoBuf)
      gl.deleteBuffer(seedBuf)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      // Chỉ giải phóng context khi canvas thật sự bị gỡ khỏi trang (rời trang chủ, đổi key).
      // StrictMode chạy cleanup rồi chạy lại effect trên CÙNG canvas — nếu loseContext ngay,
      // lần chạy lại nhận context đã mất → shader lỗi → lớp hạt tắt.
      window.setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext()
      }, 0)
    }
  }, [quality, generation])

  return (
    <canvas
      // Đổi chất lượng hoặc khôi phục context → canvas mới (một canvas chỉ có một WebGL context)
      key={`${quality}-${generation}`}
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[5] w-full"
    />
  )
}
