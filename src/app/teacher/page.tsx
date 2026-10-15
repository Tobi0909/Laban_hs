import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classes as classesTable } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { isClassSessionOpen } from "@/lib/auth/class-session";
import { SessionToggle } from "./SessionToggle";

export default async function TeacherDashboardPage() {
  const { teacherId } = await requireTeacher();

  const myClasses = await db.query.classes.findMany({ where: eq(classesTable.teacherId, teacherId) });
  const classesWithStatus = await Promise.all(
    myClasses.map(async (c) => ({ ...c, sessionOpen: await isClassSessionOpen(c.id) })),
  );

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-sky-deep">Lớp của cô/thầy</h1>
        <div className="flex gap-2">
          <Link
            href="/teacher/bank"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-paper"
          >
            Ngân hàng bài
          </Link>
          <Link
            href="/teacher/classes/new"
            className="rounded-lg bg-sky-deep px-4 py-2 text-sm font-medium text-white hover:bg-sky"
          >
            Tạo lớp mới
          </Link>
        </div>
      </div>

      {classesWithStatus.length === 0 && (
        <p className="text-ink/60">Chưa có lớp nào. Hãy tạo lớp đầu tiên.</p>
      )}

      <ul className="flex flex-col gap-3">
        {classesWithStatus.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div>
              <Link href={`/teacher/classes/${c.id}`} className="font-medium text-sky-deep hover:underline">
                {c.name} — Lớp {c.grade}
              </Link>
              <p className="text-sm text-ink/60">
                Mã vào lớp: <code>{c.joinCode}</code>
              </p>
            </div>
            <SessionToggle classId={c.id} sessionOpen={c.sessionOpen} />
          </li>
        ))}
      </ul>
    </main>
  );
}
