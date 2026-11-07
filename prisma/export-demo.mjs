// Xuất dữ liệu demo của frontend ra prisma/seed-data.json (nguồn dữ liệu cho seed.ts).
// Dùng esbuild có sẵn trong frontend/node_modules (không cài thêm gói). Chạy: npm run db:export-demo
// Chỉ chạy lại khi dữ liệu demo ở frontend thay đổi.
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '../../frontend')
const require = createRequire(import.meta.url)
const esbuild = require(resolve(frontend, 'node_modules/esbuild'))

const tmp = mkdtempSync(resolve(tmpdir(), 'wm-export-'))
const bundle = resolve(tmp, 'bundle.cjs')
const outFile = resolve(here, 'seed-data.json')

// Giả lập tối thiểu môi trường trình duyệt: kho zustand (persist) cần localStorage rỗng → dùng dữ liệu mẫu ban đầu
const banner = `
const __mem = new Map();
const __ls = { getItem: (k) => (__mem.has(k) ? __mem.get(k) : null), setItem: (k, v) => { __mem.set(k, String(v)) }, removeItem: (k) => { __mem.delete(k) }, clear: () => __mem.clear(), key: () => null, get length() { return __mem.size } };
Object.defineProperty(globalThis, 'localStorage', { value: __ls, configurable: true });
globalThis.window = globalThis;
globalThis.document = { documentElement: { style: {}, classList: { add() {}, remove() {} } }, addEventListener() {}, createElement: () => ({ style: {} }) };
globalThis.addEventListener = () => {};
`

await esbuild.build({
  entryPoints: [resolve(here, 'export-entry.ts')],
  outfile: bundle,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  tsconfig: resolve(frontend, 'tsconfig.json'), // để các alias @/, @pages… tìm đúng file
  nodePaths: [resolve(frontend, 'node_modules')],
  banner: { js: banner },
  define: { 'import.meta.env': '{"MODE":"production","DEV":false,"PROD":true,"BASE_URL":"/","VITE_API_URL":""}' },
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.svg': 'dataurl', '.webp': 'dataurl', '.mp4': 'dataurl' },
  logLevel: 'warning',
})

execFileSync(process.execPath, [bundle], { env: { ...process.env, SEED_OUT: outFile }, stdio: 'inherit' })
console.log('Đã ghi', outFile)
