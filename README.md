# La bàn tự tin

Web giúp học sinh tiểu học (lớp 1–5) tập tự đánh giá việc học: dự đoán mức tự tin, làm bài để có
bằng chứng, so sánh dự đoán với kết quả, rồi tự chọn bước học tiếp. Không xếp hạng, không áp lực.

## Stack

- Next.js (App Router) + TypeScript strict, deploy trên Vercel.
- Tailwind CSS, Framer Motion, dnd-kit, lucide-react (trang giáo viên).
- Postgres serverless Neon + Drizzle ORM.
- Auth.js v5 (Google cho giáo viên; Credentials tự viết cho học sinh).
- Upstash Redis (rate limit/khoá tạm), Vercel Blob (ảnh/MP3), Vercel AI SDK (chỉ trang giáo viên).
- Serwist (PWA) + IndexedDB cho mạng yếu.
- Zod, Vitest, Playwright.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền các biến bên dưới (xem phần Deploy Vercel)
npm run db:generate          # (chỉ khi đổi schema) sinh migration mới
npm run db:migrate           # áp migration vào DATABASE_URL
npm run db:seed              # seed 1 giáo viên mẫu, lớp 2A, 6 học sinh
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

- Trang giáo viên: `/teacher/login` → đăng nhập Google → mở phiên lớp.
- Trang học sinh: `/c/2A2026` (mã lớp seed sẵn) — chỉ vào được khi phiên lớp đang mở. Sau khi vào
  lớp, bấm "Bắt đầu học" để làm chủ đề "Phép cộng có nhớ trong phạm vi 100" (4 màn: La bàn → Nhiệm
  vụ → Gương phản tư → Chọn đường học), tối đa 5 bài hoặc 15 phút.
- `/styleguide` — soát đồ hoạ (chỉ hiện ở `NODE_ENV !== 'production'`).
- `/dev/learn-preview` — soát 4 màn học bằng dữ liệu mẫu, không cần đăng nhập/DB (chỉ dev).

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
| `ANTHROPIC_API_KEY` | AI Gateway — chỉ dùng ở trang giáo viên, route học sinh không bao giờ import. |

## Lệnh kiểm tra

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test         # Vitest (unit test: calibrate(), không-import-AI ở route học sinh)
npm run test:e2e    # Playwright (luồng đăng nhập học sinh, viewport tablet)
npm run build        # Production build
```

`test:e2e` cần server dev đang chạy với `DATABASE_URL`/Upstash thật và đã `db:seed` (dùng học sinh
"Bin" trong lớp seed `2A2026`). Test dùng route `POST /api/dev/class-session` (chỉ tồn tại ngoài
production) để mở/đóng phiên lớp mà không cần đăng nhập Google thật.

## Database (Drizzle)

Schema đầy đủ theo `<data_model>` tại [`src/lib/db/schema.ts`](src/lib/db/schema.ts).

```bash
npm run db:generate   # Sinh migration từ schema (không cần kết nối DB)
npm run db:migrate    # Áp migration vào DATABASE_URL
npm run db:seed       # Seed dữ liệu mẫu (xem src/lib/db/seed.ts)
npm run db:studio     # Mở Drizzle Studio
```

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
6. Khai báo toàn bộ biến ở trên trong Project Settings → Environment Variables (Production +
   Preview).
7. Sau lần deploy đầu tiên, chạy migration + seed nhắm vào DB production/preview:
   ```bash
   DATABASE_URL=<connection-string-production> npm run db:migrate
   DATABASE_URL=<connection-string-production> npm run db:seed   # chỉ khi muốn dữ liệu mẫu
   ```
8. Deploy — Next.js App Router build tự động nhận diện; `/styleguide` tự ẩn (404) vì chạy ở
   `NODE_ENV=production`.

## Quy tắc kỹ thuật quan trọng

- Chấm bài bằng code thuần (`lib/learning/grade.ts`), AI không bao giờ chấm bài.
- `answer_key` không gửi xuống client trước khi nộp bài; nội dung `status='draft'` không trả cho
  route học sinh.
- Route học sinh (`src/app/c`, `src/app/s`) không import module AI — có test tự động kiểm tra
  (`src/lib/learning/no-ai-in-student-routes.test.ts`).
- Mọi Server Action xác thực qua `requireStudent()`/`requireTeacher()` (session), không nhận user
  id từ client.
- Không thu email/ngày sinh/ảnh/giọng nói/vị trí học sinh; `students.guardian_consent_at` bắt buộc
  khi tạo học sinh. Không script/font/tracker bên thứ ba ở trang học sinh — CSP khai báo trong
  `src/proxy.ts`, font tự host qua `next/font`.
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
- [ ] Giai đoạn 3 — Trang giáo viên nâng cao: soạn/duyệt bài, AI draft, xem xu hướng lớp.

**Lưu ý môi trường**: Bộ khung đã qua `lint`/`typecheck`/`test`/`build` sạch. Đã kiểm tra trực quan
`/styleguide` và cả 4 màn học (`/dev/learn-preview`, chỉ dev, dùng dữ liệu mẫu — không qua DB) ở
1024×768 và 768×1024. Các luồng cần kết nối Neon/Upstash/Google OAuth thật (migrate, seed, đăng
nhập Google, Playwright e2e `test:e2e` cho cả luồng đăng nhập và luồng học trọn phiên) chưa chạy
được trong môi trường phát triển hiện tại vì chưa có thông tin đăng nhập dịch vụ thật — hãy điền
`.env.local` theo bảng biến môi trường ở trên rồi chạy lại các lệnh trong mục "Chạy local" để xác
minh đầy đủ.
