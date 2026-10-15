import { notFound } from "next/navigation";
import { LearnPreview } from "./LearnPreview";

/**
 * Trang nội bộ (chỉ dev) để chụp ảnh/soát trực quan 4 màn học bằng dữ liệu
 * mẫu — không gọi server action/DB thật, dùng cho mục đích QA thiết kế.
 */
export default function LearnPreviewPage() {
  if (process.env.NODE_ENV === "production" && process.env.LIGHTHOUSE_TEST !== "1") {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <LearnPreview />
    </main>
  );
}
