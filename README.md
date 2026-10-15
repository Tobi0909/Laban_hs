# La bàn tự tin

Web giúp học sinh tiểu học (lớp 1–5) tập tự đánh giá việc học: dự đoán mức tự tin, làm bài để có
bằng chứng, so sánh dự đoán với kết quả, rồi tự chọn bước học tiếp. Không xếp hạng, không áp lực.

## Stack

- Next.js (App Router) + TypeScript strict, deploy trên Vercel.
- Tailwind CSS, Framer Motion, dnd-kit, Recharts (xu hướng lớp), lucide-react (trang giáo viên).
- Postgres serverless Neon + Drizzle ORM.
- Auth.js v5 (Google cho giáo viên; Credentials tự viết cho học sinh).
- Upstash Redis (rate limit/khoá tạm), Vercel Blob (ảnh/MP3), Vercel AI SDK (chỉ trang giáo viên).
- Serwist (PWA, qua `@serwist/turbopack`) + IndexedDB (`idb`) cho hàng đợi khi mất mạng.
- Zod, Vitest, Playwright + `@axe-core/playwright`.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền các biến bên dưới (xem phần Deploy Vercel)
npm run db:generate          # (chỉ khi đổi schema) sinh migration mới
npm run db:migrate           # áp migration vào DATABASE_URL
npm run db:seed              # seed 1 giáo viên mẫu, lớp 2A, 6 học sinh, 1 chủ đề mẫu
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

- Trang giáo viên: `/teacher/login` → đăng nhập Google → mở phiên lớp.
- Trang học sinh: `/c/2A2026` (mã lớp seed sẵn) — chỉ vào được khi phiên lớp đang mở. Sau khi vào
  lớp, bấm "Bắt đầu học" để làm chủ đề "Phép cộng có nhớ trong phạm vi 100" (4 màn: La bàn → Nhiệm
  vụ → Gương phản tư → Chọn đường học), tối đa 5 bài hoặc 15 phút, rồi có thể mở **Nhật ký hành
  trình** (`/journal`) — bản đồ hòn đảo với các viên đá kể lại từng lần làm bài.
- `/teacher/bank` — soạn/duyệt bài (dạng bài, gợi ý AI, xem trước như học sinh, sinh audio khi Duyệt).
- `/teacher/insights` — xu hướng lớp theo chủ đề/tuần (biểu đồ match/over/under, lỗi thường gặp,
  đường học được chọn nhiều, danh sách em cần hỗ trợ). Ẩn số liệu khi nhóm &lt; 5 em.
- `/styleguide`, `/dev/learn-preview`, `/dev/journal-preview` — soát đồ hoạ bằng dữ liệu mẫu, không
  cần đăng nhập/DB (chỉ hiện ở `NODE_ENV !== 'production'`).

## Biến môi trường

Xem [`.env.example`](.env.example). Được validate qua Zod tại [`src/lib/env.ts`](src/lib/env.ts) —
thiếu biến nào, app sẽ báo lỗi rõ ràng ngay khi khởi động thay vì lỗi ngầm lúc chạy.

| Biến | Mô tả |
| --- | --- |
| `DATABASE_URL` | Connection string Postgres (Neon, dạng `postgres://...`). |
| `AUTH_SECRET` | Secret ký JWT cho Auth.js — sinh bằng `npx auth secret`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth Google cho đăng nhập giáo viên. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limit + khoá tạm sau 5 lần đoán sai. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (lưu ảnh/âm thanh bài tập). |
| `AI_MODEL` | Model qua Vercel AI Gateway (vd `anthropic/claude-sonnet-4-5`) — chỉ dùng ở `/teacher/bank`. |
| `AI_GATEWAY_API_KEY` | Key AI Gateway (tự có khi deploy trên Vercel; cần set thủ công khi chạy local). |
| `ANTHROPIC_API_KEY` | Dự phòng nếu không qua Gateway. Route học sinh không bao giờ import AI. |
| `TTS_PROVIDER` | `mock` (mặc định, sinh file câm để test kiến trúc) hoặc `http` (gọi 1 API TTS thật). |
| `TTS_API_KEY` / `TTS_API_URL` | Bắt buộc khi `TTS_PROVIDER=http` — đổi nhà cung cấp TTS chỉ cần đổi 2 biến này. |
| `CRON_SECRET` | Bảo vệ `/api/cron/cleanup` — sinh bằng `openssl rand -hex 32`. |
| `RETENTION_DAYS` | Số ngày giữ dữ liệu lượt học trước khi cron tự xoá (mặc định 180). |

## Lệnh kiểm tra

```bash
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test          # Vitest (grade/calibration, checks.ts, insights, schema AI, không-import-AI...)
npm run test:e2e     # Playwright (xem 2 project bên dưới)
npm run build         # Production build
```

- `test:e2e` cần server dev đang chạy với `DATABASE_URL`/Upstash thật và đã `db:seed` (dùng học
  sinh "Bin" trong lớp seed `2A2026`). Dùng route `POST /api/dev/class-session` (chỉ tồn tại ngoài
  production) để mở/đóng phiên lớp mà không cần đăng nhập Google thật. Gồm: đăng nhập học sinh, làm
  trọn 1 phiên, và **mất mạng giữa phiên rồi có mạng lại không mất bài**
  (`e2e/offline-sync.spec.ts`, dùng `context.setOffline()`).
- `e2e/accessibility.spec.ts` chạy axe-core trên `/`, `/teacher/login`, `/dev/learn-preview`,
  `/dev/journal-preview` — không cần DB thật, luôn chạy được. Dùng project `a11y-chromium` (Chromium
  thuần, không cần cài thêm thư viện hệ thống như WebKit):
  ```bash
  npx playwright test e2e/accessibility.spec.ts --project=a11y-chromium
  ```
  Lần chạy gần nhất: **0 lỗi serious/critical** trên cả 4 trang. Lighthouse (mobile, Chrome headless)
  trên `/dev/learn-preview` và `/dev/journal-preview`: **Accessibility 100, Performance 98–99,
  Best Practices 96, SEO 100** — vượt mục tiêu Accessibility ≥ 95 / Performance ≥ 85.

## Database (Drizzle)

Schema đầy đủ theo `<data_model>` tại [`src/lib/db/schema.ts`](src/lib/db/schema.ts).

```bash
npm run db:generate   # Sinh migration từ schema (không cần kết nối DB)
npm run db:migrate    # Áp migration vào DATABASE_URL
npm run db:seed       # Seed dữ liệu mẫu (xem src/lib/db/seed.ts)
npm run db:studio     # Mở Drizzle Studio
```

### Thêm chủ đề mới

Có 2 cách:

1. **Qua giao diện (khuyến nghị)** — `/teacher/bank`:
   - Gõ tên chủ đề mới ở ô "Tên chủ đề mới" (đầu trang) → Tạo chủ đề.
   - Bấm "+ Bài mới" trong chủ đề đó → chọn dạng bài (pick_image/drag_drop/number/true_false/
     order_steps) → soạn đề, đáp án, ví dụ, giải thích (có thể dùng nút ✦ AI để gợi ý) → xem trước
     ở khung tablet bên phải → "Lưu nháp" → "Duyệt" (tự sinh audio cho mọi câu chữ của bài).
   - Thêm câu phản tư cho chủ đề ở `/teacher/bank/reflections` (nên có đủ 3 mức match/over/under,
     có thể dùng AI gợi ý cả bộ 3 cùng lúc) → Duyệt từng câu.
   - Học sinh chỉ thấy bài có `status='approved'` (xem `GET /api/session-pack/[topicId]`).
2. **Qua code (seed)** — thêm vào mảng `SEED_TASKS`/`SEED_REFLECTION_TEMPLATES` trong
   [`src/lib/db/seed-content/math-grade2-addition.ts`](src/lib/db/seed-content/math-grade2-addition.ts)
   (hoặc tạo file tương tự cho chủ đề khác), rồi gọi từ
   [`src/lib/db/seed.ts`](src/lib/db/seed.ts) và chạy lại `npm run db:seed`. Cách này hợp khi cần
   soạn hàng loạt bài offline rồi nạp một lần; `answer_key` viết tay vẫn phải theo đúng shape
   `TaskAnswerKey` ở [`src/lib/learning/types.ts`](src/lib/learning/types.ts).

## Xác thực & vào lớp

- **Giáo viên**: đăng nhập Google tại `/teacher/login`. Lần đầu đăng nhập tự tạo bản ghi `teachers`
  theo email. Middleware (`src/proxy.ts`) chặn toàn bộ `/teacher/*` nếu chưa đăng nhập giáo viên.
- **Học sinh**: vào `/c/[joinCode]` → chỉ thấy lưới avatar khi phiên lớp (`class_sessions`) đang mở
  → chạm avatar của mình → chạm đúng 2 hình bí mật (thứ tự giáo viên đã đặt khi thêm học sinh) hoặc
  quét thẻ QR in sẵn. Xác thực qua "vé đăng nhập" một lần (`login-ticket`, TTL 60s trong Redis) để
  Server Action kiểm tra xong mới gọi `next-auth` `signIn`, tránh lộ logic chấm mật khẩu ra client.
  Sai 5 lần liên tiếp → khoá học sinh đó 10 phút (Upstash). Đóng phiên lớp → học sinh đang học bị
  tự đăng xuất ở lần tải trang kế tiếp (`/s`). Nút "Đổi bạn" luôn có để đăng xuất chủ động.
- Mật khẩu hình/token QR không bao giờ lưu dạng chữ thường (plaintext) — chỉ lưu HMAC-SHA256
  (khoá = `AUTH_SECRET`), xem [`src/lib/auth/picture-secret.ts`](src/lib/auth/picture-secret.ts).

## Soạn bài với AI (chỉ trang giáo viên)

`/teacher/bank` — soạn bài theo từng dạng (pick_image/drag_drop/number/true_false/order_steps),
xem trước đúng như học sinh sẽ thấy (khung tablet), rồi Duyệt.

- **`POST /api/author/suggest`** — gọi `generateObject` (Vercel AI SDK) qua AI Gateway
  (`src/lib/ai/suggest.ts`), model lấy từ `AI_MODEL`. 4 loại: `distractors` (3 đáp án nhiễu gắn
  mistake_tag), `steps` (các bước cho StepCards + worked_example), `reflections` (bộ 3 câu phản tư
  match/over/under), `simplify` (viết lại câu cho đúng khối lớp). System prompt
  (`AUTHOR_SYSTEM_PROMPT`) bắt câu ngắn theo khối lớp, xưng "em", không khen/chê năng lực, câu
  phản tư không lộ đáp án, không thương hiệu/nhân vật có bản quyền. **Prompt chỉ chứa nội dung bài
  học** (đề/mô tả đáp án/chủ đề/khối lớp) — không bao giờ có dữ liệu học sinh. Mỗi lần gọi lưu vào
  `ai_drafts`; rate limit 20 lần/10 phút/giáo viên (`src/lib/ai/rate-limit.ts`).
- Gợi ý AI chỉ đổ vào state của form trên trình duyệt giáo viên; phải bấm "Lưu nháp" mới ghi vào DB
  (status luôn là `draft`), và phải bấm **Duyệt** (`approveTask`/`approveReflectionTemplate`) thì
  `status` mới thành `approved` — route học sinh (`GET /api/session-pack`, `submitAnswer`) chỉ đọc
  `status='approved'`, nên **không có đường nào chữ AI sinh ra tới tay học sinh mà chưa qua Duyệt.**
- **`lib/authoring/checks.ts`** — cảnh báo (không chặn cứng) trước khi Duyệt: câu quá dài so với
  khối lớp (>12 từ lớp 1–2, >20 từ lớp 3–5), câu phản tư có số (dễ lộ đáp án), từ khen/chê năng lực.
- **`POST /api/author/tts`** (và `/api/author/tts/upload`) — khi Duyệt, tự sinh MP3/WAV cho mọi câu
  chữ của bài (đề, lựa chọn, ví dụ, câu phản tư) qua adapter `lib/tts/` (đổi nhà cung cấp bằng
  `TTS_PROVIDER`/`TTS_API_KEY`/`TTS_API_URL`, không sửa code), lưu Vercel Blob, ghi URL vào DB. Giáo
  viên nghe thử/tạo lại/tải file tự ghi âm thay thế từng câu ở khung "Audio" dưới form sửa bài.
  `AudioButton` ưu tiên file đã sinh, chỉ dùng Web Speech khi thiếu file (adapter sẵn sàng đổi sang
  MP3 thu sẵn mà không đổi component học sinh).

## Nhật ký hành trình & xu hướng lớp

- **`/journal`** (màn 5) — bản đồ hòn đảo SVG, mỗi attempt là 1 viên đá trên con đường uốn lượn
  (`src/app/journal/JourneyMap.tsx`), cuộn ngang mượt trên cảm ứng. Mặt viên đá = mood của Kim theo
  mức tự tin, huy hiệu = tia sáng (đúng) hoặc kính lúp (chưa đúng) — không số, không %. Chạm 1 viên
  đá mở thẻ nhỏ "Em đã đoán…/Kết quả…/Em chọn…" có nút loa đọc to toàn bộ câu.
- **`/teacher/insights`** — lọc theo lớp/chủ đề/khoảng thời gian; `lib/insights/aggregate.ts` (hàm
  thuần, có unit test) tính tỷ lệ match/over/under, lỗi thường gặp theo `mistake_tag`, đường học
  được chọn nhiều nhất, và danh sách "em cần hỗ trợ" (tự tin sai lặp lại ≥3 lần, hoặc luôn chọn 1
  mức tự tin ≥4 lần liên tiếp). **Ẩn toàn bộ số liệu khi nhóm có dưới 5 em có dữ liệu** (bảo vệ
  riêng tư nhóm nhỏ) — không bảng xếp hạng, không xuất điểm cá nhân.
- Giáo viên có thể **xuất CSV** dữ liệu học tập của lớp mình (`GET /api/teacher/export?classId=`,
  nút "Xuất CSV" ở trang quản lý lớp) và **xoá toàn bộ dữ liệu 1 học sinh** (nút "Xoá dữ liệu" —
  xoá bản ghi `students` sẽ cascade xoá sessions/attempts/reflections/next_steps liên quan) khi phụ
  huynh rút đồng ý.

## PWA & hoạt động khi mất mạng

- Cấu hình qua `@serwist/turbopack` (tương thích Turbopack — bundler mặc định của Next.js 16):
  service worker biên dịch từ [`src/app/sw.ts`](src/app/sw.ts), phục vụ tại route động
  `src/app/serwist/[path]/route.ts`, đăng ký qua `<SerwistProvider>` trong `layout.tsx` (tắt ở dev,
  chỉ bật ở production để tránh rối khi code đang thay đổi liên tục).
- Cache: tài nguyên tĩnh (JS/CSS/font) theo `defaultCache` của Serwist; `GET /api/session-pack/*`
  theo chiến lược NetworkFirst (ưu tiên bản mới nhất, dùng bản đã lưu khi mất mạng giữa phiên); MP3
  bài học (Vercel Blob) theo CacheFirst — tải 1 lần, dùng lại không cần mạng.
- `manifest.ts` (App Router "special file") cho phép cài lên màn hình tablet (biểu tượng
  `public/icon.svg`, `display: "standalone"`).
- **Hàng đợi ngoại tuyến**: khi `submitAnswer` gọi lên server thất bại (mất mạng), bài làm được lưu
  vào IndexedDB (`src/lib/offline/queue.ts`, qua `idb`) thay vì mất — màn hình chuyển sang trạng
  thái chờ nhẹ nhàng (Kim + hình đám mây, không có từ "lỗi"/dấu chấm than). Khi có mạng lại (sự kiện
  `online`, hoặc poll định kỳ), `src/lib/offline/sync-manager.ts` tự gửi lại lên
  **`POST /api/sync`** — idempotent theo `client_id` (gửi lại nhiều lần không tạo trùng attempt, vì
  dùng chung logic chấm với Server Action qua `src/lib/learning/submit-answer.ts`). Khi còn bài
  đang chờ gửi, góc màn hình hiện 1 hình đám mây nhỏ + "Đang lưu tạm — sẽ gửi khi có mạng"
  (`src/components/kid/OfflineIndicator.tsx`).

## Dọn dữ liệu quá hạn (Vercel Cron)

[`vercel.json`](vercel.json) khai báo cron gọi `GET /api/cron/cleanup` mỗi ngày (18:00 UTC = 01:00
giờ Việt Nam). Route kiểm tra header `Authorization: Bearer <CRON_SECRET>` trước khi chạy, xoá các
bản ghi `sessions` cũ hơn `RETENTION_DAYS` ngày — xoá `sessions` sẽ cascade xoá luôn
attempts/reflections/next_steps liên quan (không để sót dữ liệu mồ côi), xem
[`src/app/api/cron/cleanup/route.ts`](src/app/api/cron/cleanup/route.ts). Vercel tự đặt header này
khi gọi cron đã cấu hình trong `vercel.json`; nếu muốn gọi thủ công để kiểm tra:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/cleanup
```

## Deploy Vercel

1. Tạo project trên Vercel, liên kết repo này.
2. **Neon Postgres**: Vercel → Storage/Marketplace → thêm Neon → biến `DATABASE_URL` được Vercel tự
   điền (hoặc copy connection string dạng pooled từ Neon console vào `DATABASE_URL`).
3. **Upstash Redis**: Vercel → Storage/Marketplace → thêm Upstash Redis → copy
   `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` (REST API, không phải connection string
   Redis thường).
4. **Vercel Blob**: Vercel → Storage → tạo Blob store → copy `BLOB_READ_WRITE_TOKEN`.
5. **Auth.js**:
   - `AUTH_SECRET`: chạy `npx auth secret` hoặc `openssl rand -base64 32`.
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`: tạo OAuth Client (loại Web application) trong
     [Google Cloud Console](https://console.cloud.google.com/apis/credentials), Authorized redirect
     URI = `https://<domain-vercel>/api/auth/callback/google`.
6. **AI Gateway**: Vercel → project Settings → AI → bật AI Gateway (tự cấp quyền qua OIDC khi chạy
   trên Vercel, không cần `AI_GATEWAY_API_KEY`; chạy local thì tạo key trong Vercel dashboard →
   AI Gateway → API Keys). Đặt `AI_MODEL` theo model muốn dùng.
7. **TTS**: để `TTS_PROVIDER=mock` nếu chưa có nhà cung cấp TTS thật (sinh file câm, kiến trúc vẫn
   chạy đúng); khi có nhà cung cấp thật, đặt `TTS_PROVIDER=http` + `TTS_API_URL`/`TTS_API_KEY`.
8. **Cron**: `CRON_SECRET` (bất kỳ chuỗi ngẫu nhiên đủ dài) + `RETENTION_DAYS`. Vercel tự đọc
   `vercel.json` và lên lịch gọi `/api/cron/cleanup`, tự thêm header `Authorization` — không cần
   cấu hình gì thêm ngoài khai báo biến môi trường.
9. Khai báo toàn bộ biến ở trên trong Project Settings → Environment Variables (Production +
   Preview).
10. Sau lần deploy đầu tiên, chạy migration + seed nhắm vào DB production/preview:
    ```bash
    DATABASE_URL=<connection-string-production> npm run db:migrate
    DATABASE_URL=<connection-string-production> npm run db:seed   # chỉ khi muốn dữ liệu mẫu
    ```
11. Deploy — Next.js App Router build tự động nhận diện (bao gồm service worker qua
    `@serwist/turbopack`, tương thích Turbopack mặc định của Next 16). `/styleguide`,
    `/dev/learn-preview`, `/dev/journal-preview` tự ẩn (404) vì chạy ở `NODE_ENV=production`.

## Quy tắc kỹ thuật quan trọng

- Chấm bài bằng code thuần (`lib/learning/grade.ts`), AI không bao giờ chấm bài.
- `answer_key` không gửi xuống client trước khi nộp bài; nội dung `status='draft'` không trả cho
  route học sinh.
- Route học sinh (`src/app/c`, `src/app/s`, `src/app/learn`, `src/app/journal`) không import module
  AI — có test tự động kiểm tra (`src/lib/learning/no-ai-in-student-routes.test.ts`).
- Mọi Server Action xác thực qua `requireStudent()`/`requireTeacher()` (session), không nhận user
  id từ client.
- Không thu email/ngày sinh/ảnh/giọng nói/vị trí học sinh; `students.guardian_consent_at` bắt buộc
  khi tạo học sinh. Không script/font/tracker bên thứ ba ở trang học sinh — CSP khai báo trong
  `src/proxy.ts`, font tự host qua `next/font`.
- `/teacher/insights` ẩn số liệu khi nhóm &lt; 5 em; không bảng xếp hạng, không xuất điểm cá nhân ở
  bất kỳ đâu trong app.
- Toàn bộ chuỗi giao diện tiếng Việt gom tại `src/lib/i18n/vi.ts`.

## Trạng thái hiện tại

- [x] Giai đoạn 0 — Khởi tạo: Next.js + TS + Tailwind, font Baloo 2/Nunito (subset vietnamese),
      bảng màu theo `<visual_design>`, `lib/env.ts`, `lib/i18n/vi.ts`, hàm `calibrate()` +
      unit test, cấu hình Vitest/Playwright/Drizzle.
- [x] Giai đoạn 1 — Data model + Auth + vào lớp: schema Drizzle đầy đủ + migration đầu tiên + seed;
      component `components/kid/` (KidButton, AudioButton, Card, ProgressStones, `<Kim/>` 8 trạng
      thái); `/styleguide`; Auth.js (Google giáo viên, Credentials học sinh qua vé đăng nhập);
      `/c/[joinCode]` (avatar + 2 hình bí mật hoặc QR), khoá tạm sau 5 lần sai; trang giáo viên
      (tạo lớp, thêm học sinh, mở/đóng phiên, in thẻ QR A4); middleware chặn `/teacher/*` + CSP.
- [x] Giai đoạn 2 — Vòng học 4 màn (không dùng AI):
      chủ đề mẫu "Phép cộng có nhớ trong phạm vi 100" (9 bài, đủ 5 dạng: pick_image, drag_drop,
      number, true_false, order_steps — mỗi bài có worked_example/explanation + đáp án nhiễu gắn
      mistake_tag) và 9 reflection_templates đã duyệt; `GET /api/session-pack/[topicId]` (không
      kèm answer_key); `/learn/[topicId]` (4 màn: La bàn → Nhiệm vụ → Gương phản tư → Chọn đường
      học) dùng `CardChoice`/`DragBoard`/`NumberPad`/`TrueFalseChoice`/`StepCards`; Server Actions
      `startAttempt`/`submitAnswer`/`submitReflection`/`chooseNextStep`; `lib/learning/grade.ts`
      (chấm theo dạng bài), `pick-reflection.ts`, `next-step.ts`; phiên tự kết thúc sau 5 bài hoặc
      15 phút → màn chúc mừng (Kim cheer + confetti ngắn, tôn trọng `prefers-reduced-motion`).
- [x] Giai đoạn 3 — Soạn bài với AI (chỉ trang giáo viên):
      `/teacher/bank` (danh sách chủ đề/bài, form soạn theo dạng + xem trước khung tablet, trạng
      thái Nháp/Đã duyệt, nút Duyệt), `/teacher/bank/reflections` (soạn/duyệt câu phản tư);
      `POST /api/author/suggest` (4 loại gợi ý qua AI Gateway, lưu `ai_drafts`, rate limit theo
      giáo viên); `lib/authoring/checks.ts` (cảnh báo trước Duyệt); `POST /api/author/tts` +
      `/upload` (sinh/nghe thử/tạo lại/tải lên audio khi Duyệt, adapter đổi nhà cung cấp qua env);
      `AudioButton` ưu tiên MP3 đã sinh, dự phòng Web Speech.
- [x] Giai đoạn 4 — Nhật ký, xu hướng lớp, PWA ngoại tuyến, dọn dữ liệu:
      `/journal` (bản đồ hòn đảo + viên đá, không số/%); `/teacher/insights` (Recharts, ẩn nhóm
      &lt;5 em, danh sách em cần hỗ trợ); PWA qua `@serwist/turbopack` + hàng đợi IndexedDB +
      `POST /api/sync` idempotent + chỉ báo đám mây; `vercel.json` cron → `/api/cron/cleanup`
      (bảo vệ `CRON_SECRET`, xoá theo `RETENTION_DAYS`); xuất CSV lớp + xoá dữ liệu 1 học sinh;
      `e2e/accessibility.spec.ts` (axe) + Lighthouse (Accessibility 100, Performance 98–99 mobile).

**Lưu ý môi trường**: Bộ khung đã qua `lint`/`typecheck`/`test` (93 test)/`build` sạch.
`e2e/accessibility.spec.ts` (axe-core) đã chạy thật trong môi trường phát triển hiện tại — **0 lỗi
serious/critical** trên 4 trang — và Lighthouse (Chrome headless, mobile) đo thật trên
`/dev/learn-preview`/`/dev/journal-preview`: Accessibility 100, Performance 98–99. Các luồng cần
Neon/Upstash/Google OAuth/AI Gateway thật (migrate, seed, đăng nhập Google, soạn bài thật với
AI/TTS, `e2e/student-login.spec.ts`, `e2e/learn-session.spec.ts`, `e2e/offline-sync.spec.ts`) chưa
chạy được trong môi trường phát triển hiện tại vì chưa có thông tin đăng nhập dịch vụ thật — hãy
điền `.env.local` theo bảng biến môi trường ở trên (để `TTS_PROVIDER=mock` nếu chưa có nhà cung cấp
TTS) rồi chạy lại các lệnh trong mục "Chạy local" để xác minh đầy đủ.
