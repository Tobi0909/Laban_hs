"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  attempts,
  classSessions,
  nextSteps,
  reflectionTemplates as reflectionTemplatesTable,
  reflections,
  sessions,
  tasks as tasksTable,
  type NextStepChoice,
} from "@/lib/db/schema";
import { requireStudent } from "@/lib/auth/guards";
import { calibrate, gradeAnswer, type Confidence } from "@/lib/learning/grade";
import { pickReflectionTemplate, type ReflectionTemplateRow } from "@/lib/learning/pick-reflection";
import { suggestNextStep } from "@/lib/learning/next-step";
import type { AnswerValue, Explanation, MistakeTag, TaskAnswerKey, WorkedExample } from "@/lib/learning/types";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

async function assertSessionOwnedByStudent(sessionId: string, studentId: string) {
  const row = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!row || row.studentId !== studentId) {
    throw new Error("Không có quyền trên phiên học này.");
  }
  return row;
}

async function assertAttemptOwnedByStudent(attemptId: string, studentId: string) {
  const attempt = await db.query.attempts.findFirst({ where: eq(attempts.id, attemptId) });
  if (!attempt) throw new Error("Không tìm thấy lượt làm bài.");
  await assertSessionOwnedByStudent(attempt.sessionId, studentId);
  return attempt;
}

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

export interface SubmitAnswerInput {
  sessionId: string;
  taskId: string;
  confidence: Confidence;
  reasonCard: string | null;
  answer: AnswerValue;
  clientId: string;
}

export interface SubmitAnswerResult {
  attemptId: string;
  isCorrect: boolean;
  calibration: ReturnType<typeof calibrate>;
  mistakeTag: MistakeTag | null;
  reflectionTemplate: ReflectionTemplateRow | null;
  nextStepSuggestion: { suggested: NextStepChoice; reasonText: string };
  workedExample: WorkedExample;
  explanation: Explanation;
}

export async function submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const student = await requireStudent();
  await assertSessionOwnedByStudent(input.sessionId, student.studentId);

  const task = await db.query.tasks.findFirst({ where: eq(tasksTable.id, input.taskId) });
  if (!task || task.status !== "approved") {
    throw new Error("Không tìm thấy bài tập.");
  }

  const existing = await db.query.attempts.findFirst({ where: eq(attempts.clientId, input.clientId) });

  let attemptId: string;
  let isCorrect: boolean;
  let mistakeTag: MistakeTag | null;
  let cal: ReturnType<typeof calibrate>;

  if (existing) {
    attemptId = existing.id;
    isCorrect = existing.isCorrect;
    mistakeTag = existing.mistakeTag as MistakeTag | null;
    cal = existing.calibration as ReturnType<typeof calibrate>;
  } else {
    const graded = gradeAnswer(task.answerKey as TaskAnswerKey, input.answer);
    isCorrect = graded.isCorrect;
    mistakeTag = graded.mistakeTag;
    cal = calibrate(input.confidence, isCorrect);

    const [created] = await db
      .insert(attempts)
      .values({
        sessionId: input.sessionId,
        taskId: input.taskId,
        confidence: input.confidence,
        reasonCard: input.reasonCard,
        answer: input.answer,
        isCorrect,
        mistakeTag,
        calibration: cal,
        clientId: input.clientId,
      })
      .returning();
    attemptId = created.id;
  }

  const approvedTemplates = await db.query.reflectionTemplates.findMany({
    where: eq(reflectionTemplatesTable.status, "approved"),
  });
  const reflectionTemplate = pickReflectionTemplate(
    approvedTemplates as unknown as ReflectionTemplateRow[],
    cal,
    mistakeTag,
    hashSeed(input.taskId),
  );

  const nextStepSuggestion = suggestNextStep(isCorrect, input.confidence);

  return {
    attemptId,
    isCorrect,
    calibration: cal,
    mistakeTag,
    reflectionTemplate,
    nextStepSuggestion,
    workedExample: task.workedExample as WorkedExample,
    explanation: task.explanation as Explanation,
  };
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
