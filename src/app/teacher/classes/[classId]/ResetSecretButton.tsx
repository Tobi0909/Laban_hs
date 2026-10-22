"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetStudentPictureSecret } from "../../actions";
import { ICON_IDS, ICON_LABELS_VI } from "@/components/kid/icons";

export function ResetSecretButton({
  classId,
  studentId,
  displayName,
}: {
  classId: string;
  studentId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-sky-deep underline">
        Đặt lại ảnh bí mật
      </button>
    );
  }

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await resetStudentPictureSecret(classId, studentId, formData);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Đặt lại ảnh bí mật thất bại.");
      }
    });
  };

  return (
    <form action={submit} className="flex items-center gap-2 text-sm">
      <span className="text-ink/70">2 hình mới cho {displayName}:</span>
      <select name="pick1" required defaultValue={ICON_IDS[0]} className="rounded-lg border border-border px-2 py-1">
        {ICON_IDS.map((id) => (
          <option key={id} value={id}>
            {ICON_LABELS_VI[id]}
          </option>
        ))}
      </select>
      <select name="pick2" required defaultValue={ICON_IDS[1]} className="rounded-lg border border-border px-2 py-1">
        {ICON_IDS.map((id) => (
          <option key={id} value={id}>
            {ICON_LABELS_VI[id]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-sky-deep px-3 py-1 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Đang lưu..." : "Lưu"}
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(false);
        }}
        className="text-ink/50 underline"
      >
        Huỷ
      </button>
      {error && <span className="text-coral">{error}</span>}
    </form>
  );
}
