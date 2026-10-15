import { notFound } from "next/navigation";
import { JourneyMap } from "@/app/journal/JourneyMap";
import type { JourneyStone } from "@/app/journal/data";
import { vi } from "@/lib/i18n/vi";

const FIXTURE_STONES: JourneyStone[] = [
  { attemptId: "1", confidence: 2, isCorrect: true, calibration: "match", prompt: "27 + 6", chosenNextStep: "practice", createdAt: new Date() },
  { attemptId: "2", confidence: 1, isCorrect: true, calibration: "under", prompt: "9 + 4", chosenNextStep: "harder", createdAt: new Date() },
  { attemptId: "3", confidence: 3, isCorrect: false, calibration: "over", prompt: "46 + 27", chosenNextStep: "review_example", createdAt: new Date() },
  { attemptId: "4", confidence: 2, isCorrect: true, calibration: "match", prompt: "68 + 15", chosenNextStep: "practice", createdAt: new Date() },
  { attemptId: "5", confidence: 3, isCorrect: true, calibration: "match", prompt: "76 + 48", chosenNextStep: "harder", createdAt: new Date() },
  { attemptId: "6", confidence: 1, isCorrect: false, calibration: "match", prompt: "64 + 19", chosenNextStep: "review_example", createdAt: new Date() },
  { attemptId: "7", confidence: 2, isCorrect: true, calibration: "match", prompt: "58", chosenNextStep: "practice", createdAt: new Date() },
];

/** Preview /journal bằng dữ liệu mẫu (chỉ dev) — không cần đăng nhập/DB. */
export default function JournalPreviewPage() {
  if (process.env.NODE_ENV === "production" && process.env.LIGHTHOUSE_TEST !== "1") {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-paper px-4 py-10">
      <h1 className="font-baloo text-3xl font-bold text-sky-deep">{vi.journey.title}</h1>
      <div className="w-full max-w-4xl">
        <JourneyMap stones={FIXTURE_STONES} />
      </div>
    </main>
  );
}
