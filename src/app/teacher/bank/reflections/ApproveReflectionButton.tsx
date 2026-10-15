"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveReflectionTemplate } from "../actions";

export function ApproveReflectionButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await approveReflectionTemplate(id);
          router.refresh();
        })
      }
      className="rounded bg-leaf px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Đang duyệt..." : "Duyệt"}
    </button>
  );
}
