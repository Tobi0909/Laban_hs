import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getJourneyStones } from "./data";
import { JourneyMap } from "./JourneyMap";
import { vi } from "@/lib/i18n/vi";

export default async function JournalPage() {
  const session = await auth();
  if (session?.user.role !== "student" || !session.user.studentId) {
    redirect("/");
  }

  const stones = await getJourneyStones(session.user.studentId);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-paper px-4 py-10">
      <h1 className="font-baloo text-3xl font-bold text-sky-deep">{vi.journey.title}</h1>
      <div className="w-full max-w-4xl">
        <JourneyMap stones={stones} />
      </div>
      <Link href="/s" className="font-nunito text-sm text-sky-deep underline">
        {vi.journey.backToClass}
      </Link>
    </main>
  );
}
