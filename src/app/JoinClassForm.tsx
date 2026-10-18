"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { vi } from "@/lib/i18n/vi";

export function JoinClassForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/c/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={vi.home.joinCodePlaceholder}
        autoCapitalize="characters"
        className="w-full rounded-lg border border-border bg-white px-4 py-3 text-center font-baloo text-lg tracking-wide"
      />
      <button
        type="submit"
        disabled={!code.trim()}
        className="rounded-lg bg-sky-deep px-5 py-3 font-medium text-white transition-colors hover:bg-sky disabled:opacity-50"
      >
        {vi.home.joinButton}
      </button>
    </form>
  );
}
