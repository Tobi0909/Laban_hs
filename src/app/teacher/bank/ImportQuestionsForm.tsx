"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importQuestionsFromFile } from "./actions";

const FORMAT_EXAMPLE = `Câu 1: 27 cộng 6 bằng mấy?
A. 32
B. 33
C. 34
D. 35
Đáp án: B

Câu 2: 15 cộng 8 bằng mấy?
Đáp án: 23`;

export function ImportQuestionsForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; warnings: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-sky-deep underline">
        Tải file đề thi
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const res = await importQuestionsFromFile(topicId, formData);
            setResult(res);
            formRef.current?.reset();
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Tạo câu hỏi từ file thất bại.");
          }
        });
      }}
      className="flex flex-col gap-2 rounded border border-dashed border-border p-3 text-sm"
    >
      <details className="text-ink/70">
        <summary className="cursor-pointer select-none font-medium">Định dạng file cần theo mẫu nào?</summary>
        <p className="mt-2">
          Mỗi câu bắt đầu bằng <code>Câu N:</code>. Câu trắc nghiệm thêm 4 dòng <code>A.</code>–<code>D.</code>, câu
          tự luận (học sinh nhập kết quả) thì không có dòng A-D. Luôn kết thúc mỗi câu bằng dòng{" "}
          <code>Đáp án: ...</code> (ghi chữ cái A-D cho trắc nghiệm, hoặc 1 số cho tự luận).
        </p>
        <pre className="mt-2 whitespace-pre-wrap rounded bg-paper p-2 text-xs">{FORMAT_EXAMPLE}</pre>
      </details>

      <label className="flex flex-col gap-1">
        File đề thi (.txt, .docx, .pdf)
        <input type="file" name="file" accept=".txt,.docx,.pdf" required className="text-sm" />
      </label>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded bg-sky-deep px-3 py-1.5 font-medium text-white disabled:opacity-50">
          {pending ? "Đang xử lý..." : "Tạo câu hỏi từ file"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            setResult(null);
          }}
          className="text-ink/50 underline"
        >
          Đóng
        </button>
      </div>
      {error && <p className="rounded bg-coral/10 p-2 text-coral">{error}</p>}
      {result && (
        <div className="rounded bg-leaf/10 p-2 text-[#2E7A4F]">
          <p>Đã tạo {result.imported} câu hỏi nháp — kéo xuống để duyệt/sửa từng câu.</p>
          {result.warnings.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-[#8A6A14]">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
