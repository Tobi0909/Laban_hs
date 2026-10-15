"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { vi } from "@/lib/i18n/vi";

export function PasswordLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const result = await signIn("teacher", { password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(true);
      return;
    }
    router.push("/teacher");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={vi.teacher.passwordLabel}
        autoFocus
        className="w-full rounded-lg border border-border bg-white px-4 py-3 text-center"
      />
      {error && <p className="text-sm text-red-600">{vi.teacher.loginError}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="rounded-lg bg-sky-deep px-5 py-3 font-medium text-white transition-colors hover:bg-sky disabled:opacity-50"
      >
        {vi.teacher.loginButton}
      </button>
    </form>
  );
}
