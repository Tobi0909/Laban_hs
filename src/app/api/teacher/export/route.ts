import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, classes, sessions, students, tasks } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(values: (string | number)[]): string {
  return values.map((v) => csvEscape(String(v))).join(",") + "\r\n";
}

/** Giáo viên xuất CSV dữ liệu học tập của lớp mình (chỉ lớp mình phụ trách). */
export async function GET(request: Request) {
  let teacherId: string;
  try {
    ({ teacherId } = await requireTeacher());
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const classId = new URL(request.url).searchParams.get("classId");
  if (!classId) return NextResponse.json({ error: "missing_class_id" }, { status: 400 });

  const classRow = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
  if (!classRow || classRow.teacherId !== teacherId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const classStudents = await db.query.students.findMany({ where: eq(students.classId, classId) });
  const studentIds = classStudents.map((s) => s.id);
  const studentNameById = new Map(classStudents.map((s) => [s.id, s.displayName]));

  let rows = "";
  rows += toCsvRow(["hoc_sinh", "de_bai", "tu_tin", "ket_qua", "calibration", "mistake_tag", "thoi_gian"]);

  if (studentIds.length > 0) {
    const classSessions = await db.query.sessions.findMany({ where: inArray(sessions.studentId, studentIds) });
    const sessionById = new Map(classSessions.map((s) => [s.id, s]));
    const sessionIds = classSessions.map((s) => s.id);

    if (sessionIds.length > 0) {
      const classAttempts = await db.query.attempts.findMany({ where: inArray(attempts.sessionId, sessionIds) });
      const taskIds = [...new Set(classAttempts.map((a) => a.taskId))];
      const classTasks = await db.query.tasks.findMany({ where: inArray(tasks.id, taskIds) });
      const taskById = new Map(classTasks.map((t) => [t.id, t]));

      for (const a of classAttempts) {
        const sessionRow = sessionById.get(a.sessionId);
        const studentName = sessionRow ? (studentNameById.get(sessionRow.studentId) ?? "?") : "?";
        const taskPrompt = taskById.get(a.taskId)?.prompt ?? "";
        rows += toCsvRow([
          studentName,
          taskPrompt,
          a.confidence,
          a.isCorrect ? "dung" : "chua_dung",
          a.calibration,
          a.mistakeTag ?? "",
          a.createdAt.toISOString(),
        ]);
      }
    }
  }

  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${classRow.name}-du-lieu-hoc-tap.csv"`,
    },
  });
}
