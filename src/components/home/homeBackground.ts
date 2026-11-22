import loopUrl from '@assets/images/home-bg-loop.webp'
import beamUrl from '@assets/images/home-bg-beam.png'
import waveUrl from '@assets/images/home-bg-wave.webp'
import tokens from '@/styles/tokens.json'

/**
 * Nền xanh trang chủ (references/backgr.png). Ảnh vòng lặp = ảnh gốc + bản lật dọc nối bên dưới,
 * nên lặp theo chiều dọc mà không lộ chỗ nối (xanh → cam → xanh…).
 *
 * Một ảnh gốc cao TILE; hero (100svh) hiện phần đầu ảnh (tia sáng → quầng cam ở đáy).
 * Phần nội dung ngay sau hero nối tiếp từ đúng vị trí đó (lệch lên 100svh).
 */
const HOME_BG_TILE = '274svh'
/** Màu xanh biển lót dưới ảnh (tokens.palette.ocean) — hiện khi ảnh chưa tải */
export const HOME_BG_FALLBACK = tokens.palette.ocean

const SIZE = `100% calc(${HOME_BG_TILE} * 2)`

/** Kiểu nền ảnh cho một lớp. `offset`: vị trí đầu ảnh vòng lặp so với mép trên lớp. */
function bgLayerStyle(offset: string) {
  return {
    backgroundColor: HOME_BG_FALLBACK,
    backgroundImage: `url(${loopUrl})`,
    backgroundSize: SIZE,
    backgroundRepeat: 'repeat-y',
    backgroundPosition: `center ${offset}`,
  }
}

/** Nền cho lớp hero (cao 100svh, bắt đầu từ đầu ảnh). */
export const heroBgStyle = bgLayerStyle('0px')

/**
 * Đoạn nối ngay dưới hero (cột tia sáng hiện dần đè lên trong HOME_BG_JOIN): ảnh hero soi gương ngược lên — từ đáy hero (hàng 100svh của ảnh)
 * về hàng 60svh, nơi tia sáng bắt đầu. Ảnh vòng lặp có nửa dưới là bản lật, hàng r của ảnh gốc nằm ở
 * 548svh − r → đầu đoạn = 448svh. Nhờ soi gương nên mép nối với hero liền tuyệt đối.
 */
export const HOME_BG_JOIN = '45svh'
export const afterHeroBgStyle = bgLayerStyle('-448svh')

/** Hàng tia sáng đồng nhất (hàng 60svh của ảnh) — nền lót dưới tia sáng lượn sóng ở đoạn nối. */
export const beamBgStyle = {
  backgroundColor: HOME_BG_FALLBACK,
  backgroundImage: `url(${beamUrl})`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
}

/**
 * Khối giữa (② → hết trang): tia sáng ở chính giữa, to nhỏ lượn sóng, hai bên tối dần cho có chiều sâu.
 * Ảnh home-bg-wave.webp = hàng tia sáng giãn ngang theo sóng, một chu kỳ = HOME_BG_WAVE, lặp liền mạch.
 * Đầu ảnh (y = 0) đúng bằng hàng tia sáng → khớp với đoạn nối dưới hero.
 */
const HOME_BG_WAVE = '150svh'
export const waveBgStyle = {
  backgroundColor: HOME_BG_FALLBACK,
  backgroundImage: `url(${waveUrl})`,
  backgroundSize: `100% ${HOME_BG_WAVE}`,
  backgroundRepeat: 'repeat-y',
}

/** Sao trôi chậm hơn nội dung: nội dung đi 1px thì lớp sao tụt lại HOME_BG_PARALLAX px. */
export const HOME_BG_PARALLAX = 0.2

/** Lớp kính tối cho ô/nhãn nhỏ nằm trực tiếp trên nền (chữ ngà luôn đọc được dù sau là vệt cam). */
export const HOME_GLASS_DARK = 'bg-wm-night/35 backdrop-blur-md backdrop-saturate-150'

/**
 * Ghim vùng "kính trắng" về bảng màu ngà: bên trong thẻ, text-page-fg/muted/line/surface
 * luôn là chữ than chì trên nền ngà dù section ngoài đang theme night (chữ ngà trên nền xanh).
 */
export const LIGHT_CARD_VARS =
  '[--page-bg:var(--wm-ivory)] [--page-fg:var(--wm-charcoal)] ' +
  '[--page-surface:color-mix(in_srgb,var(--wm-charcoal)_5%,var(--wm-ivory))] ' +
  '[--page-edge:color-mix(in_srgb,var(--wm-charcoal)_60%,var(--wm-ivory))] ' +
  '[--page-muted:color-mix(in_srgb,var(--wm-charcoal)_82%,var(--wm-ivory))] ' +
  '[--page-line:color-mix(in_srgb,var(--wm-charcoal)_18%,var(--wm-ivory))]'
