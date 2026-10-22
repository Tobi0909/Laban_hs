"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClass } from "./actions";

export function DeleteClassButton({ classId, classLabel }: { classId: string; classLabel: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-ink/70">Xoá lớp {classLabel} và toàn bộ dữ liệu?</span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                try {
                  await deleteClass(classId);
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Xoá lớp thất bại.");
                }
              })
            }
            className="rounded bg-coral px-3 py-1 font-medium text-white disabled:opacity-50"
          >
            {pending ? "Đang xoá..." : "Xác nhận xoá"}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setConfirming(false);
            }}
            className="text-ink/50 underline"
          >
            Huỷ
          </button>
        </div>
        {error && <p className="rounded bg-coral/10 px-2 py-1 text-coral">{error}</p>}
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="text-sm text-coral underline">
      Xoá lớp
    </button>
  );
}
