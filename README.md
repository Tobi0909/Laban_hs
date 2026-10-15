# La bàn tự tin

Web giúp học sinh tiểu học (lớp 1–5) tập tự đánh giá việc học: dự đoán mức tự tin, làm bài để có
bằng chứng, so sánh dự đoán với kết quả, rồi tự chọn bước học tiếp. Không xếp hạng, không áp lực.

## Stack

- Next.js (App Router) + TypeScript strict, deploy trên Vercel.
- Tailwind CSS, Framer Motion, dnd-kit, lucide-react (trang giáo viên).
- Postgres serverless Neon + Drizzle ORM.
- Auth.js (Google cho giáo viên; Credentials tự viết cho học sinh).
- Upstash Redis (rate limit), Vercel Blob (ảnh/MP3), Vercel AI SDK (chỉ trang giáo viên).
- Serwist (PWA) + IndexedDB cho mạng yếu.
- Zod, Vitest, Playwright.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền các biến bên dưới
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Biến môi trường

Xem [`.env.example`](.env.example). Được validate qua Zod tại [`src/lib/env.ts`](src/lib/env.ts).

| Biến | Mô tả |
| --- | --- |
| `DATABASE_URL` | Connection string Postgres (Neon). |
| `AUTH_SECRET` | Secret cho Auth.js. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth Google cho đăng nhập giáo viên. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (lưu ảnh/âm thanh). |
| `ANTHROPIC_API_KEY` | AI Gateway — chỉ dùng ở trang giáo viên, route học sinh không bao giờ import. |

## Lệnh kiểm tra

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test         # Vitest (unit test, vd. lib/learning/grade.ts)
npm run test:e2e    # Playwright (luồng chính, viewport tablet)
npm run build        # Production build
```

## Database (Drizzle)

Schema đặt tại [`src/lib/db/schema.ts`](src/lib/db/schema.ts) (sẽ hiện thực theo `<data_model>` ở
giai đoạn kế tiếp).

```bash
npm run db:generate   # Sinh migration từ schema
npm run db:migrate    # Áp migration vào DATABASE_URL
npm run db:studio     # Mở Drizzle Studio
```

## Deploy Vercel

1. Tạo project trên Vercel, liên kết repo này.
2. Thêm Neon Postgres, Upstash Redis, Vercel Blob qua Vercel Marketplace/Storage.
3. Khai báo đủ biến môi trường ở trên trong Project Settings.
4. Deploy — Next.js App Router build tự động nhận diện.

## Quy tắc kỹ thuật quan trọng

- Chấm bài bằng code thuần (`lib/learning/grade.ts`), AI không bao giờ chấm bài.
- `answer_key` không gửi xuống client trước khi nộp bài; nội dung `status='draft'` không trả cho
  route học sinh.
- Route học sinh không import module AI; Server Action luôn xác thực qua session, không nhận
  user id từ client.
- Toàn bộ chuỗi giao diện tiếng Việt gom tại `src/lib/i18n/vi.ts`.

## Trạng thái hiện tại

- [x] Giai đoạn 0 — Khởi tạo: Next.js + TS + Tailwind, font Baloo 2/Nunito (subset vietnamese),
      bảng màu theo `<visual_design>`, `lib/env.ts`, `lib/i18n/vi.ts`, hàm `calibrate()` +
      unit test, cấu hình Vitest/Playwright/Drizzle.
- [ ] Giai đoạn 1 — Data model: schema Drizzle đầy đủ + migrations.
- [ ] Giai đoạn 2 — Auth: giáo viên (Google) và học sinh (Credentials).
- [ ] Giai đoạn 3 — 5 màn hình học sinh + linh vật `<Kim/>`.
- [ ] Giai đoạn 4 — Trang giáo viên (soạn/duyệt bài, AI draft, xem xu hướng lớp).
