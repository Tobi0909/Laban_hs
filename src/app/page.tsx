import Link from "next/link";
import { vi } from "@/lib/i18n/vi";
import { JoinClassForm } from "./JoinClassForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-baloo text-4xl font-bold text-sky-deep">
          {vi.common.appName}
        </h1>
        <p className="max-w-md font-nunito text-lg text-ink/70">{vi.home.tagline}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-baloo text-xl font-semibold text-ink">{vi.home.studentHeading}</h2>
        <p className="text-sm text-ink/70">{vi.home.joinCodeLabel}</p>
        <JoinClassForm />
      </div>

      <Link href="/teacher/login" className="text-sm text-ink/60 underline hover:text-sky-deep">
        {vi.home.teacherLinkPrompt}
      </Link>
    </main>
  );
}
