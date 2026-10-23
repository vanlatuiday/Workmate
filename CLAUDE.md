# Workmate frontend

Nền tảng việc làm linh hoạt. Đọc trước khi làm:
- `prj-context.md` — nghiệp vụ, vai trò, trạng thái từng route ([có]/[khung]/[chưa rõ]), định hướng.
- `DESIGN.md` — design system (token, chữ, màu, chuyển động). `references/framer-DESIGN.md` chỉ để tham khảo cách trình bày, **không** áp phong cách.

Chủ dự án không chuyên kỹ thuật: giải thích thay đổi quan trọng bằng tiếng Việt đơn giản.

## Kiến trúc
React 18 + TypeScript + Vite 5 + Tailwind 3 · React Router 6 · Zustand · axios.
GSAP + ScrollTrigger (`@utils/gsap`), Lenis, motion — **chỉ trang công khai**.
`src/pages/{public,jobseeker,recruiter,admin}` · `src/components/{home,layout,motion,common}` ·
`src/services` (API, backend nằm ngoài repo) · `src/context` (store) · `src/styles/tokens.json` (bảng màu).
Alias: `@/`, `@components`, `@pages`, `@hooks`, `@context`, `@services`, `@utils`, `@styles`, `@constants`, `@assets`. Kiểu dữ liệu: `@/types`.

## Quy ước code
- UI và comment bằng tiếng Việt; route tiếng Việt không dấu.
- Màu chỉ từ `tokens.json` (`wm-*`, `page-*`); không hex trong component. Bo góc `rounded-full|card|control`.
- Chuyển động: chỉ transform/opacity, luôn có nhánh `prefers-reduced-motion`; dashboard không dùng hiệu ứng cuộn.
- Không over-engineer; tái sử dụng component có sẵn; không xóa code chưa rõ vai trò.

## Skills
- `workmate-ui` — **luôn dùng** khi sửa/thêm UI. Ưu tiên: yêu cầu người dùng > DESIGN.md > workmate-ui > skill khác.
- `frontend-design` — định hướng sáng tạo khi thiết kế trang mới (không ghi đè DESIGN.md).
- `ui-ux-pro-max` — tra cứu/nghiên cứu UX (`python3 "${CLAUDE_SKILL_DIR}/scripts/search.py" …`), chỉ tham khảo.
- `web-design-guidelines` — audit UI (tải luật từ GitHub, cần mạng).
- `vercel-react-best-practices` — hiệu năng React; bỏ qua quy tắc riêng cho Next.js/server.

## Phân công Opus → Sonnet
Opus (phiên chính) = tech lead: phân tích, lập kế hoạch, quyết định kiến trúc, review, xử lý việc khó.
Agents trong `.claude/agents/` (đều `model: sonnet`):
- `frontend-builder` — viết code. Giao việc kèm **danh sách file được sửa** và tiêu chí nghiệm thu.
- `visual-qa` — chụp/đo giao diện trong Chrome thật, chỉ báo cáo.
- `code-reviewer` — review diff, chỉ báo cáo.

Quy tắc: mặc định giao implementation cho `frontend-builder`; việc nhỏ (vài dòng) thì làm thẳng,
không tạo subagent. Không cho hai agent sửa cùng một file cùng lúc. Opus chỉ tự code khi kiến trúc
phức tạp, logic nhiều ràng buộc, bug nghiêm trọng Sonnet không xử lý được, hoặc refactor rủi ro cao.
Luôn tự đọc diff trước khi nhận kết quả của agent.

## Quy trình làm giao diện mới
1. Opus đọc yêu cầu + ảnh trong `references/`, chốt hướng thị giác theo DESIGN.md.
2. `frontend-builder` dựng bản đầu, rồi responsive.
3. `visual-qa` chụp 1440 / 768 / 390px, so với reference, liệt kê sai lệch.
4. `frontend-builder` sửa → `code-reviewer` review (khi thay đổi không nhỏ) → Opus nghiệm thu.
Chỉ nói đã kiểm tra bằng screenshot khi thật sự đã chụp.

## Lệnh
- Dev: `npx vite --port 5173` (sửa `tailwind.config.js` thì khởi động lại).
- Kiểm tra: `npx tsc --noEmit -p .` · `npm run lint` · `npm run build`.
- Chưa có test tự động.

## Git & an toàn
- Commit checkpoint trước thay đổi lớn. Không force push, không ghi đè thay đổi chưa commit.
- Hỏi trước khi: cài/gỡ package, chạy script ngoài chưa kiểm tra, xóa/ghi đè file quan trọng, refactor lớn, đổi cấu hình dự án.
- `skills/`, `agent-skills/`, `ui-ux-pro-max-skill/` là repo tải về để tham khảo (đã gitignore); skill đang dùng nằm trong `.claude/skills/`.
