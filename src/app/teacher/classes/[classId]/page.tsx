import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { students as studentsTable } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { isClassSessionOpen } from "@/lib/auth/class-session";
import { SessionToggle } from "../../SessionToggle";
import { AddStudentForm } from "./AddStudentForm";
import { AVATARS } from "@/components/kid/icons";

export default async function ClassManagePage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requireTeacher(classId);

  const classRow = await db.query.classes.findFirst({ where: (c, { eq: eqOp }) => eqOp(c.id, classId) });
  if (!classRow) notFound();

  const classStudents = await db.query.students.findMany({ where: eq(studentsTable.classId, classId) });
  const sessionOpen = await isClassSessionOpen(classId);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sky-deep">
            {classRow.name} — Lớp {classRow.grade}
          </h1>
          <p className="text-sm text-ink/60">
            Mã vào lớp: <code>{classRow.joinCode}</code> · Link:{" "}
            <code>/c/{classRow.joinCode}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SessionToggle classId={classId} sessionOpen={sessionOpen} />
          <Link
            href={`/teacher/classes/${classId}/print`}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-paper"
          >
            In thẻ QR
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Học sinh ({classStudents.length})</h2>
        <ul className="flex flex-col gap-2">
          {classStudents.map((s) => {
            const Avatar = AVATARS[s.avatarId as keyof typeof AVATARS];
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <div className="h-10 w-10">{Avatar ? <Avatar /> : null}</div>
                <span className="font-medium">{s.displayName}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Thêm học sinh</h2>
        <AddStudentForm classId={classId} />
      </section>
    </main>
  );
}
