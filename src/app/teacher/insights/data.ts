import "server-only";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, classes, nextSteps, sessions, students, topics } from "@/lib/db/schema";
import {
  countActiveStudents,
  countByCalibration,
  countByMistakeTag,
  countByNextStep,
  findStudentsNeedingSupport,
  isGroupTooSmall,
  type AttemptRow,
  type CalibrationCounts,
  type MistakeTagCount,
  type NextStepCount,
  type SupportReason,
} from "@/lib/insights/aggregate";
import type { Calibration, Confidence } from "@/lib/learning/grade";
import type { MistakeTag } from "@/lib/learning/types";

export interface InsightsFilters {
  classId: string;
  topicId?: string;
  days: number;
}

export interface StudentSupportInfo {
  studentId: string;
  displayName: string;
  reasons: SupportReason[];
}

export interface InsightsData {
  className: string;
  topics: { id: string; title: string }[];
  activeStudentCount: number;
  totalAttempts: number;
  isTooSmall: boolean;
  calibrationCounts: CalibrationCounts;
  mistakeTagCounts: MistakeTagCount[];
  nextStepCounts: NextStepCount[];
  studentsNeedingSupport: StudentSupportInfo[];
}

export async function getInsightsData(filters: InsightsFilters, teacherId: string): Promise<InsightsData> {
  const classRow = await db.query.classes.findFirst({ where: eq(classes.id, filters.classId) });
  if (!classRow || classRow.teacherId !== teacherId) {
    throw new Error("Không có quyền xem lớp này.");
  }

  const classTopics = await db.query.topics.findMany({ where: eq(topics.classId, filters.classId) });

  const classStudents = await db.query.students.findMany({ where: eq(students.classId, filters.classId) });
  const studentIds = classStudents.map((s) => s.id);
  const studentNameById = new Map(classStudents.map((s) => [s.id, s.displayName]));

  if (studentIds.length === 0) {
    return {
      className: classRow.name,
      topics: classTopics.map((t) => ({ id: t.id, title: t.title })),
      activeStudentCount: 0,
      totalAttempts: 0,
      isTooSmall: true,
      calibrationCounts: { match: 0, over: 0, under: 0 },
      mistakeTagCounts: [],
      nextStepCounts: [],
      studentsNeedingSupport: [],
    };
  }

  const classSessions = await db.query.sessions.findMany({
    where: filters.topicId
      ? and(inArray(sessions.studentId, studentIds), eq(sessions.topicId, filters.topicId))
      : inArray(sessions.studentId, studentIds),
  });
  const sessionById = new Map(classSessions.map((s) => [s.id, s]));
  const sessionIds = classSessions.map((s) => s.id);

  if (sessionIds.length === 0) {
    return {
      className: classRow.name,
      topics: classTopics.map((t) => ({ id: t.id, title: t.title })),
      activeStudentCount: 0,
      totalAttempts: 0,
      isTooSmall: true,
      calibrationCounts: { match: 0, over: 0, under: 0 },
      mistakeTagCounts: [],
      nextStepCounts: [],
      studentsNeedingSupport: [],
    };
  }

  const cutoff = new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000);
  const rangeAttempts = await db.query.attempts.findMany({
    where: and(inArray(attempts.sessionId, sessionIds), gte(attempts.createdAt, cutoff)),
  });

  const attemptRows: AttemptRow[] = rangeAttempts
    .map((a) => {
      const sessionRow = sessionById.get(a.sessionId);
      if (!sessionRow) return null;
      const row: AttemptRow = {
        studentId: sessionRow.studentId,
        calibration: a.calibration as Calibration,
        mistakeTag: a.mistakeTag as MistakeTag | null,
        isCorrect: a.isCorrect,
        confidence: a.confidence as Confidence,
      };
      return row;
    })
    .filter((r): r is AttemptRow => r !== null);

  const attemptIds = rangeAttempts.map((a) => a.id);
  const rangeNextSteps =
    attemptIds.length > 0
      ? await db.query.nextSteps.findMany({ where: inArray(nextSteps.attemptId, attemptIds) })
      : [];

  const tooSmall = isGroupTooSmall(attemptRows);

  return {
    className: classRow.name,
    topics: classTopics.map((t) => ({ id: t.id, title: t.title })),
    activeStudentCount: countActiveStudents(attemptRows),
    totalAttempts: attemptRows.length,
    isTooSmall: tooSmall,
    calibrationCounts: tooSmall ? { match: 0, over: 0, under: 0 } : countByCalibration(attemptRows),
    mistakeTagCounts: tooSmall ? [] : countByMistakeTag(attemptRows),
    nextStepCounts: tooSmall ? [] : countByNextStep(rangeNextSteps),
    studentsNeedingSupport: tooSmall
      ? []
      : findStudentsNeedingSupport(attemptRows).map((f) => ({
          studentId: f.studentId,
          displayName: studentNameById.get(f.studentId) ?? "?",
          reasons: f.reasons,
        })),
  };
}
