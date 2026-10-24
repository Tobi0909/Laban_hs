"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReflectionTemplate } from "../actions";

export function DeleteReflectionButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-2 whitespace-nowrap text-sm">
        <span className="text-ink/70">Xoá câu này?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteReflectionTemplate(id);
              router.refresh();
            })
          }
          className="rounded bg-coral px-2 py-1 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Đang xoá..." : "Xác nhận xoá"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-ink/50 underline">
          Huỷ
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="text-sm text-coral underline">
      Xoá
    </button>
  );
}
