"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addStudent } from "../../actions";
import { AVATAR_IDS, AVATARS, AVATAR_LABELS_VI, ICON_IDS, ICONS, ICON_LABELS_VI } from "@/components/kid/icons";
import { vi } from "@/lib/i18n/vi";

export function AddStudentForm({ classId }: { classId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await addStudent(classId, formData);
        router.refresh();
        (document.getElementById("add-student-form") as HTMLFormElement | null)?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      }
    });
  };

  return (
    <form id="add-student-form" action={submit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      {error && <p className="text-sm text-coral">{error}</p>}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Biệt danh
        <input name="displayName" required className="rounded-lg border border-border px-3 py-2" placeholder="Bin" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Avatar</legend>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_IDS.map((id, i) => {
            const Avatar = AVATARS[id];
            return (
              <label key={id} className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-border p-2 has-[:checked]:border-sky-deep has-[:checked]:bg-sky/10">
                <input type="radio" name="avatarId" value={id} required defaultChecked={i === 0} className="sr-only" />
                <div className="h-8 w-8">
                  <Avatar />
                </div>
                <span className="text-xs">{AVATAR_LABELS_VI[id]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">2 hình bí mật (học sinh sẽ chạm đúng 2 hình này để vào lớp)</legend>
        <div className="grid grid-cols-6 gap-2">
          {ICON_IDS.map((id) => {
            const Icon = ICONS[id];
            return (
              <div key={id} className="flex flex-col items-center gap-1 rounded-lg border border-border p-2">
                <div className="h-8 w-8">
                  <Icon />
                </div>
                <span className="text-xs">{ICON_LABELS_VI[id]}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Hình 1
            <select name="pick1" required className="rounded-lg border border-border px-2 py-1">
              {ICON_IDS.map((id) => (
                <option key={id} value={id}>
                  {ICON_LABELS_VI[id]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hình 2
            <select name="pick2" required defaultValue={ICON_IDS[1]} className="rounded-lg border border-border px-2 py-1">
              {ICON_IDS.map((id) => (
                <option key={id} value={id}>
                  {ICON_LABELS_VI[id]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Ngày nhận phiếu đồng ý phụ huynh
        <input type="date" name="guardianConsentAt" required className="rounded-lg border border-border px-3 py-2" />
        <span className="text-xs text-ink/50">{vi.teacher.guardianConsentRequired}</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-sky-deep px-4 py-2 font-medium text-white hover:bg-sky disabled:opacity-50"
      >
        {vi.teacher.addStudent}
      </button>
    </form>
  );
}
