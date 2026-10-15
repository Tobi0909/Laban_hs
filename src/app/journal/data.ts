import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, nextSteps, sessions, tasks } from "@/lib/db/schema";
import type { Confidence, Calibration } from "@/lib/learning/grade";
import type { NextStepChoice } from "@/lib/db/schema";

export interface JourneyStone {
  attemptId: string;
  confidence: Confidence;
  isCorrect: boolean;
  calibration: Calibration;
  prompt: string;
  chosenNextStep: NextStepChoice | null;
  createdAt: Date;
}

const MAX_STONES = 40;

export async function getJourneyStones(studentId: string): Promise<JourneyStone[]> {
  const mySessions = await db.query.sessions.findMany({ where: eq(sessions.studentId, studentId) });
  if (mySessions.length === 0) return [];
  const sessionIds = mySessions.map((s) => s.id);

  const myAttempts = await db.query.attempts.findMany({
    where: inArray(attempts.sessionId, sessionIds),
    orderBy: desc(attempts.createdAt),
    limit: MAX_STONES,
  });
  if (myAttempts.length === 0) return [];

  const attemptIds = myAttempts.map((a) => a.id);
  const taskIds = [...new Set(myAttempts.map((a) => a.taskId))];

  const [myNextSteps, myTasks] = await Promise.all([
    db.query.nextSteps.findMany({ where: inArray(nextSteps.attemptId, attemptIds) }),
    db.query.tasks.findMany({ where: inArray(tasks.id, taskIds) }),
  ]);

  const nextStepByAttempt = new Map(myNextSteps.map((n) => [n.attemptId, n.chosen]));
  const taskById = new Map(myTasks.map((t) => [t.id, t]));

  return myAttempts
    .map((a) => {
      const task = taskById.get(a.taskId);
      return {
        attemptId: a.id,
        confidence: a.confidence as Confidence,
        isCorrect: a.isCorrect,
        calibration: a.calibration as Calibration,
        prompt: task?.prompt ?? "",
        chosenNextStep: nextStepByAttempt.get(a.id) ?? null,
        createdAt: a.createdAt,
      };
    })
    .reverse(); // cũ → mới, đi từ trái sang phải trên bản đồ
}
