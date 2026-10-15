"use client";

import { signIn } from "next-auth/react";
import { vi } from "@/lib/i18n/vi";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/teacher" })}
      className="rounded-lg bg-sky-deep px-5 py-3 font-medium text-white transition-colors hover:bg-sky"
    >
      {vi.teacher.loginWithGoogle}
    </button>
  );
}
