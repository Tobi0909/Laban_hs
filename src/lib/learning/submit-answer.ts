import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, reflectionTemplates as reflectionTemplatesTable, sessions, tasks as tasksTable, type NextStepChoice } from "@/lib/db/schema";
import { calibrate, gradeAnswer, type Confidence } from "./grade";
import { pickReflectionTemplate, type ReflectionTemplateRow } from "./pick-reflection";
import { suggestNextStep } from "./next-step";
import { describeAnswer } from "./describe-answer";
import type { AnswerValue, Explanation, MistakeTag, TaskAnswerKey, TaskContent, WorkedExample } from "./types";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function assertSessionOwnedByStudent(sessionId: string, studentId: string) {
  const row = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!row || row.studentId !== studentId) {
    throw new Error("Không có quyền trên phiên học này.");
  }
  return row;
}

export async function assertAttemptOwnedByStudent(attemptId: string, studentId: string) {
  const attempt = await db.query.attempts.findFirst({ where: eq(attempts.id, attemptId) });
  if (!attempt) throw new Error("Không tìm thấy lượt làm bài.");
  await assertSessionOwnedByStudent(attempt.sessionId, studentId);
  return attempt;
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
  prompt: string;
  answerText: string;
}

/**
 * Logic chấm bài + chọn mẫu phản tư + gợi ý đường học dùng chung cho cả
 * Server Action (đường online bình thường) và POST /api/sync (đồng bộ lại
 * các lượt làm bài đã xếp hàng trong IndexedDB khi mất mạng).
 */
export async function submitAnswerCore(studentId: string, input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  await assertSessionOwnedByStudent(input.sessionId, studentId);

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
    prompt: task.prompt,
    answerText: describeAnswer(task.options as TaskContent, (task.answerKey as TaskAnswerKey).correct),
  };
}
