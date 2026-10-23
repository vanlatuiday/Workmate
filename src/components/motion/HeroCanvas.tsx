import { useEffect, useRef } from 'react'
import { useExperienceStore, type Quality } from '@context/experienceStore'
import { cn } from '@utils/cn'

type Props = {
  className?: string
}

/** Thông số theo mức chất lượng: độ phân giải render, số tầng noise, giới hạn FPS. */
const SETTINGS: Record<Quality, { scale: number; maxDpr: number; octaves: number; fps: number; grain: number }> = {
  // Trường noise mềm nên render nửa độ phân giải rồi phóng lên gần như không khác,
  // mà rẻ hơn 4 lần. Đo trên Intel UHD 630 ở 1792px: scale 1 → 26fps.
  high: { scale: 0.5, maxDpr: 1, octaves: 4, fps: 60, grain: 0.035 },
  // Trường noise rất mịn nên render 1/3 độ phân giải rồi phóng lên vẫn ổn
  low: { scale: 0.35, maxDpr: 1, octaves: 3, fps: 30, grain: 0 },
}

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

// Domain-warped fbm: noise bẻ cong noise, cho cảm giác chất lỏng chảy chậm.
// Giữ độ sáng thấp để logo màu ngà phía trên vẫn đủ tương phản.
const FRAGMENT = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_octaves;
uniform float u_grain;

// Hash cho các đỉnh lưới noise: hoán vị mod 289 (như simplex noise của Ashima).
// Mọi giá trị trung gian là số nguyên < 2^24 nên chính xác tuyệt đối — hai ô kề
// nhau luôn ra cùng một giá trị ở đỉnh chung. Hash kiểu fract(p * 123.34) bị
// fast-math/FMA của GPU làm lệch ở đỉnh chung → noise vỡ thành ô vuông.
float permute(float x) { return mod((x * 34.0 + 1.0) * x, 289.0); }

float hash(vec2 i) {
  i = mod(i, 289.0);
  return permute(permute(i.x) + i.y) / 289.0;
}

// Hash rẻ cho lớp hạt — không cần liên tục giữa các pixel
float grain(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (float(i) >= u_octaves) break;
    v += a * noise(p);
    p = p * 2.02 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 m = (u_mouse - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.04;

  // Con trỏ đẩy nhẹ trường noise quanh nó
  vec2 toMouse = p - m;
  p += toMouse * 0.12 * exp(-4.0 * dot(toMouse, toMouse));

  vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 + vec2(5.2, 1.3) - t));
  float n = fbm(p * 1.4 + q * 1.8 + vec2(t * 0.6, -t * 0.4));

  // Bảng màu trung tính ấm: than chì → xám đậm, quầng sáng ngà rất nhẹ quanh con trỏ
  vec3 base  = vec3(0.141, 0.145, 0.133);   // charcoal #242522
  vec3 slate = vec3(0.235, 0.239, 0.212);   // giữa charcoal và graphite #454640
  vec3 ivory = vec3(0.953, 0.941, 0.914);   // ivory #F3F0E9

  vec3 col = mix(base, slate, smoothstep(0.35, 0.85, n));
  float glow = exp(-3.0 * length(toMouse));
  col += ivory * 0.035 * glow * smoothstep(0.3, 0.8, n);

  // Tối dần về các góc
  col *= 1.0 - 0.6 * smoothstep(0.3, 0.95, length(uv - vec2(0.5, 0.55)));

  col += (grain(gl_FragCoord.xy + fract(u_time)) - 0.5) * u_grain;

  // Nhạt dần về nền than chì ở đáy để hòa vào section kế tiếp. Làm trong shader
  // thay vì CSS mask-image: mask trên canvas đang chạy khiến trình duyệt tính
  // lại mặt nạ mỗi khung hình (đo trên Intel UHD 630: 24fps → 57fps khi bỏ mask).
  col = mix(base, col, smoothstep(0.0, 0.3, uv.y));
  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[HeroCanvas]', gl.getShaderInfoLog(shader))
    return null
  }
  return shader
}

/**
 * Nền WebGL cho hero. Không làm gì nếu trình duyệt không hỗ trợ WebGL —
 * phía dưới vẫn là nền than chì nên trang trông bình thường.
 * Tự dừng khi hero ra khỏi màn hình hoặc tab bị ẩn.
 */
export default function HeroCanvas({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const quality = useExperienceStore((s) => s.quality)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    if (!vs || !fs) return

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.useProgram(program)

    // Một tam giác phủ kín màn hình
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uOctaves = gl.getUniformLocation(program, 'u_octaves')
    const uGrain = gl.getUniformLocation(program, 'u_grain')

    const settings = SETTINGS[quality]
    gl.uniform1f(uOctaves, settings.octaves)
    gl.uniform1f(uGrain, settings.grain)

    let ratio = 1
    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, settings.maxDpr) * settings.scale
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Con trỏ: vị trí đích + vị trí hiện tại trôi dần theo (đơn vị pixel của canvas)
    const target = { x: canvas.width * 0.65, y: canvas.height * 0.55 }
    const mouse = { ...target }
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      target.x = (e.clientX - rect.left) * ratio
      target.y = (rect.bottom - e.clientY) * ratio // WebGL tính y từ dưới lên
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    // Chỉ vẽ khi hero đang trong khung nhìn và tab đang hiện
    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    })
    io.observe(canvas)
    const onVisibility = () => {
      if (!document.hidden) start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    let frame = 0
    let running = false
    let last = 0
    let shown = false
    const startTime = performance.now()
    const minDelta = 1000 / settings.fps - 2

    const loop = (now: number) => {
      if (!visible || document.hidden) {
        running = false
        return
      }
      frame = requestAnimationFrame(loop)
      if (now - last < minDelta) return
      last = now

      mouse.x += (target.x - mouse.x) * 0.06
      mouse.y += (target.y - mouse.y) * 0.06
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.uniform1f(uTime, (now - startTime) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      // Hiện canvas sau khung hình đầu, tránh nháy nền đen của WebGL
      if (!shown) {
        shown = true
        canvas.style.opacity = '1'
      }
    }

    function start() {
      if (running) return
      running = true
      frame = requestAnimationFrame(loop)
    }
    start()

    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(frame)
      running = false
      canvas.style.opacity = '0'
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [quality])

  return (
    <canvas
      // Đổi chất lượng → canvas mới. Một canvas chỉ có một WebGL context,
      // tạo lại sạch hơn là cố gỡ trạng thái cũ.
      key={quality}
      ref={canvasRef}
      aria-hidden
      className={cn('block w-full h-full opacity-0 transition-opacity duration-1000', className)}
    />
  )
}
