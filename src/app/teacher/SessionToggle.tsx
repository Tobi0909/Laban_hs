"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { openClassSession, closeClassSession } from "./actions";
import { vi } from "@/lib/i18n/vi";

export function SessionToggle({ classId, sessionOpen }: { classId: string; sessionOpen: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (sessionOpen) {
            await closeClassSession(classId);
          } else {
            await openClassSession(classId);
          }
          router.refresh();
        })
      }
      className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
        sessionOpen ? "bg-coral hover:bg-coral/90" : "bg-leaf hover:bg-leaf/90"
      }`}
    >
      {sessionOpen ? vi.teacher.closeSession : vi.teacher.openSession}
    </button>
  );
}
