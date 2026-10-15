"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { classSessions, nextSteps, reflections, sessions, type NextStepChoice } from "@/lib/db/schema";
import { requireStudent } from "@/lib/auth/guards";
import {
  assertAttemptOwnedByStudent,
  assertSessionOwnedByStudent,
  submitAnswerCore,
  type SubmitAnswerInput,
  type SubmitAnswerResult,
} from "@/lib/learning/submit-answer";

export type { SubmitAnswerInput, SubmitAnswerResult };

export async function startAttempt(topicId: string): Promise<{ sessionId: string } | { error: "session_closed" }> {
  const student = await requireStudent();

  const openClassSession = await db.query.classSessions.findFirst({
    where: and(eq(classSessions.classId, student.classId), isNull(classSessions.closedAt)),
  });
  if (!openClassSession) {
    return { error: "session_closed" };
  }

  const [created] = await db
    .insert(sessions)
    .values({ studentId: student.studentId, classSessionId: openClassSession.id, topicId })
    .returning();

  return { sessionId: created.id };
}

export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const student = await requireStudent();
  return submitAnswerCore(student.studentId, input);
}

export async function submitReflection(attemptId: string, templateId: string, choiceId: string) {
  const student = await requireStudent();
  await assertAttemptOwnedByStudent(attemptId, student.studentId);

  const existing = await db.query.reflections.findFirst({ where: eq(reflections.attemptId, attemptId) });
  if (existing) return;

  await db.insert(reflections).values({ attemptId, templateId, choiceId });
}

export async function chooseNextStep(attemptId: string, suggested: NextStepChoice, chosen: NextStepChoice) {
  const student = await requireStudent();
  await assertAttemptOwnedByStudent(attemptId, student.studentId);

  const existing = await db.query.nextSteps.findFirst({ where: eq(nextSteps.attemptId, attemptId) });
  if (existing) return;

  await db.insert(nextSteps).values({ attemptId, suggested, chosen });
}

export async function endSession(sessionId: string) {
  const student = await requireStudent();
  await assertSessionOwnedByStudent(sessionId, student.studentId);

  await db.update(sessions).set({ endedAt: new Date() }).where(eq(sessions.id, sessionId));
}
