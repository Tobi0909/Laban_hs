"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { getClassByJoinCode, getOpenClassSession } from "@/lib/auth/class-session";
import { isStudentLocked, recordFailedAttempt, clearFailedAttempts } from "@/lib/auth/student-lock";
import { verifyPictureSecret, verifyQrToken } from "@/lib/auth/picture-secret";
import { issueLoginTicket } from "@/lib/auth/login-ticket";
import type { IconId } from "@/components/kid/icons";

export interface ClassEntryData {
  className: string;
  sessionOpen: boolean;
  students: { id: string; displayName: string; avatarId: string }[];
}

export async function getClassEntryData(joinCode: string): Promise<ClassEntryData | null> {
  const classRow = await getClassByJoinCode(joinCode);
  if (!classRow) return null;

  const openSession = await getOpenClassSession(classRow.id);
  const sessionOpen = Boolean(openSession);

  const classStudents = sessionOpen
    ? await db.query.students.findMany({ where: eq(students.classId, classRow.id) })
    : [];

  return {
    className: classRow.name,
    sessionOpen,
    students: classStudents.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      avatarId: s.avatarId,
    })),
  };
}

export type PictureLoginResult =
  | { ok: true; ticket: string }
  | { ok: false; reason: "session_closed" | "locked" | "wrong"; remaining?: number };

export async function attemptPictureLogin(
  joinCode: string,
  studentId: string,
  picks: IconId[],
): Promise<PictureLoginResult> {
  const classRow = await getClassByJoinCode(joinCode);
  if (!classRow) return { ok: false, reason: "session_closed" };

  const openSession = await getOpenClassSession(classRow.id);
  if (!openSession) return { ok: false, reason: "session_closed" };

  if (await isStudentLocked(studentId)) {
    return { ok: false, reason: "locked" };
  }

  const student = await db.query.students.findFirst({
    where: and(eq(students.id, studentId), eq(students.classId, classRow.id)),
  });
  if (!student) return { ok: false, reason: "wrong" };

  if (!verifyPictureSecret(studentId, picks, student.pictureSecretHash)) {
    const { locked, remaining } = await recordFailedAttempt(studentId);
    return { ok: false, reason: locked ? "locked" : "wrong", remaining };
  }

  await clearFailedAttempts(studentId);
  const ticket = await issueLoginTicket(studentId);
  return { ok: true, ticket };
}

export async function attemptQrLogin(joinCode: string, token: string): Promise<PictureLoginResult> {
  const classRow = await getClassByJoinCode(joinCode);
  if (!classRow) return { ok: false, reason: "session_closed" };

  const openSession = await getOpenClassSession(classRow.id);
  if (!openSession) return { ok: false, reason: "session_closed" };

  const classStudents = await db.query.students.findMany({ where: eq(students.classId, classRow.id) });
  const match = classStudents.find((s) => verifyQrToken(token, s.qrTokenHash));
  if (!match) return { ok: false, reason: "wrong" };

  if (await isStudentLocked(match.id)) {
    return { ok: false, reason: "locked" };
  }

  await clearFailedAttempts(match.id);
  const ticket = await issueLoginTicket(match.id);
  return { ok: true, ticket };
}
