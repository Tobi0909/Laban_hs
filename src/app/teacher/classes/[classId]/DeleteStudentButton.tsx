"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStudentData } from "../../actions";

export function DeleteStudentButton({
  classId,
  studentId,
  displayName,
}: {
  classId: string;
  studentId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink/70">Xoá toàn bộ dữ liệu của {displayName}?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteStudentData(classId, studentId);
              router.refresh();
            })
          }
          className="rounded bg-coral px-3 py-1 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Đang xoá..." : "Xác nhận xoá"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-ink/50 underline">
          Huỷ
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="text-sm text-coral underline">
      Xoá dữ liệu
    </button>
  );
}
