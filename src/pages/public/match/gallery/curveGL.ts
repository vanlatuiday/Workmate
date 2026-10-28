// Bộ vẽ WebGL cho bộ sưu tập ảnh cong ở /match (theo video references/p4.mp4).
// Mỗi ảnh là một tấm lưới đặt đúng chỗ thẻ DOM tương ứng; vertex shader uốn tấm lưới
// quanh một "trống lăn" nằm ngang ở mép trên/dưới khung nhìn, cuộn càng nhanh thì
// trống càng nhỏ (cong mạnh hơn) và mặt ảnh gợn sóng. Không dùng thư viện 3D.

const VERTEX = `
attribute vec2 a_uv;
uniform vec4 u_rect;      // x, y, w, h — px CSS, gốc ở góc trên trái khung nhìn
uniform vec2 u_view;      // rộng, cao khung nhìn (px CSS)
uniform vec2 u_edges;     // đường uốn trên / dưới (px)
uniform float u_radius;   // bán kính trống lăn (px)
uniform float u_vel;      // vận tốc cuộn đã làm mượt, -1..1
uniform float u_time;
varying vec2 v_uv;
varying float v_bend;     // 0 = phẳng, 1 = đã cuộn hết một phần tư vòng

const float HALF_PI = 1.5707963;

void main() {
  vec2 p = u_rect.xy + a_uv * u_rect.zw;
  float y = p.y;
  float z = 0.0;
  float bend = 0.0;

  // Mép trên: phần nằm trên đường uốn cuộn ngược ra sau quanh trống
  float dt = u_edges.x - p.y;
  if (dt > 0.0) {
    float th = min(dt / u_radius, HALF_PI * 1.15);
    y = u_edges.x - u_radius * sin(th);
    z = -u_radius * (1.0 - cos(th));
    bend = th / HALF_PI;
  }
  // Mép dưới: cong nhẹ hơn (trống lớn gấp rưỡi)
  float rb = u_radius * 1.5;
  float db = p.y - u_edges.y;
  if (db > 0.0) {
    float th = min(db / rb, HALF_PI);
    y = u_edges.y + rb * sin(th);
    z = -rb * (1.0 - cos(th));
    bend = th / HALF_PI;
  }

  // Gợn sóng theo tốc độ cuộn — như tấm vải bị kéo
  float speed = abs(u_vel);
  z += speed * 26.0 * sin(p.x / u_view.x * 6.2832 + u_time * 2.4)
     * sin(p.y / u_view.y * 3.1416 + u_time * 1.3);

  // Phối cảnh: camera cách mặt phẳng ảnh một khoảng D. Tâm ngang lấy theo giữa từng thẻ
  // để hai cột không bị kéo dính vào nhau khi cuộn ra sau; tâm dọc ở giữa khung nhìn.
  float D = u_view.y * 0.9;
  float s = D / (D - z);
  vec2 c = vec2(u_rect.x + u_rect.z * 0.5, u_view.y * 0.5);
  vec2 q = (vec2(p.x, y) - c) * s + c;

  gl_Position = vec4(q.x / u_view.x * 2.0 - 1.0, 1.0 - q.y / u_view.y * 2.0, 0.0, 1.0);
  v_uv = a_uv;
  v_bend = clamp(bend, 0.0, 1.0);
}
`

const FRAGMENT = `
// highp: u_vel dùng chung với vertex shader (mặc định highp) — lệch độ chính xác thì không link được
precision highp float;
uniform sampler2D u_tex;
uniform vec4 u_cover;     // scale.xy, offset.xy — giống object-fit: cover
uniform vec2 u_size;      // kích thước thẻ (px) để bo góc
uniform float u_round;    // bán kính bo góc (px)
uniform float u_sat;      // 0 = giảm màu ấm, 1 = màu gốc
uniform float u_zoom;     // phóng nhẹ khi rê chuột
uniform float u_vel;
varying vec2 v_uv;
varying float v_bend;

void main() {
  // Bo góc bằng SDF hình chữ nhật
  vec2 px = v_uv * u_size;
  vec2 d = abs(px - u_size * 0.5) - (u_size * 0.5 - u_round);
  float dist = length(max(d, 0.0)) - u_round;
  float mask = 1.0 - smoothstep(-0.75, 0.75, dist);
  if (mask <= 0.0) discard;

  vec2 uv = (v_uv - 0.5) / u_zoom + 0.5;
  uv = uv * u_cover.xy + u_cover.zw;

  // Tách màu rất nhẹ ở phần đang cong và khi cuộn nhanh
  float ab = v_bend * 0.006 + abs(u_vel) * 0.003;
  vec3 col = vec3(
    texture2D(u_tex, uv + vec2(0.0, ab)).r,
    texture2D(u_tex, uv).g,
    texture2D(u_tex, uv - vec2(0.0, ab)).b
  );

  // Giảm màu ngả ấm cho hợp bảng màu trung tính của web
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 warm = vec3(lum) * vec3(1.05, 1.0, 0.92);
  col = mix(mix(warm, col, 0.35), col, u_sat);

  // Tối dần khi cuộn ra sau trống, mờ hẳn khi gần hết một phần tư vòng
  col *= 1.0 - v_bend * 0.3;
  float alpha = mask * (1.0 - smoothstep(0.8, 1.1, v_bend));
  gl_FragColor = vec4(col * alpha, alpha);
}
`

/** Số ô lưới mỗi chiều — đủ mịn để đường cong không gãy khúc */
const SEGMENTS = 28

export interface CardDraw {
  rect: DOMRect
  tex: WebGLTexture
  /** Tỉ lệ rộng/cao của ảnh gốc */
  texAspect: number
  sat: number
  zoom: number
}

export interface FrameParams {
  width: number
  height: number
  edges: [number, number]
  radius: number
  vel: number
  time: number
  round: number
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[CurvedGallery]', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

/** Tạo bộ vẽ; trả null nếu trình duyệt không có WebGL hoặc shader lỗi (khi đó giữ ảnh DOM). */
export function createCurveRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true })
  if (!gl) return null

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  if (!vs || !fs) return null
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  // Lưới SEGMENTS × SEGMENTS trong không gian uv [0,1]²
  const uvs: number[] = []
  for (let j = 0; j <= SEGMENTS; j++) for (let i = 0; i <= SEGMENTS; i++) uvs.push(i / SEGMENTS, j / SEGMENTS)
  const idx: number[] = []
  const row = SEGMENTS + 1
  for (let j = 0; j < SEGMENTS; j++)
    for (let i = 0; i < SEGMENTS; i++) {
      const a = j * row + i
      idx.push(a, a + 1, a + row, a + 1, a + row + 1, a + row)
    }
  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW)
  const ibo = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW)
  const aUv = gl.getAttribLocation(program, 'a_uv')
  gl.enableVertexAttribArray(aUv)
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0)

  const u = (name: string) => gl.getUniformLocation(program, name)
  const U = {
    rect: u('u_rect'), view: u('u_view'), edges: u('u_edges'), radius: u('u_radius'),
    vel: u('u_vel'), time: u('u_time'), cover: u('u_cover'), size: u('u_size'),
    round: u('u_round'), sat: u('u_sat'), zoom: u('u_zoom'), tex: u('u_tex'),
  }
  gl.uniform1i(U.tex, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const textures = new Set<WebGLTexture>()

  return {
    /** Nạp ảnh đã tải xong thành texture */
    upload(img: HTMLImageElement) {
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      textures.add(tex)
      return tex
    },

    resize(width: number, height: number, dpr: number) {
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    },

    draw(cards: CardDraw[], f: FrameParams) {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(U.view, f.width, f.height)
      gl.uniform2f(U.edges, f.edges[0], f.edges[1])
      gl.uniform1f(U.radius, f.radius)
      gl.uniform1f(U.vel, f.vel)
      gl.uniform1f(U.time, f.time)
      gl.uniform1f(U.round, f.round)
      for (const c of cards) {
        const { rect: r } = c
        gl.uniform4f(U.rect, r.left, r.top, r.width, r.height)
        gl.uniform2f(U.size, r.width, r.height)
        // object-fit: cover — cắt bớt chiều dư của ảnh
        const box = r.width / r.height
        const sx = c.texAspect > box ? box / c.texAspect : 1
        const sy = c.texAspect > box ? 1 : c.texAspect / box
        gl.uniform4f(U.cover, sx, sy, (1 - sx) / 2, (1 - sy) / 2)
        gl.uniform1f(U.sat, c.sat)
        gl.uniform1f(U.zoom, c.zoom)
        gl.bindTexture(gl.TEXTURE_2D, c.tex)
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0)
      }
    },

    clear() {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    },

    destroy() {
      textures.forEach((t) => gl.deleteTexture(t))
      gl.deleteBuffer(vbo)
      gl.deleteBuffer(ibo)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    },
  }
}

export type CurveRenderer = NonNullable<ReturnType<typeof createCurveRenderer>>
