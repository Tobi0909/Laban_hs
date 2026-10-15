import type { Calibration, Confidence } from "@/lib/learning/grade";
import type { MistakeTag } from "@/lib/learning/types";
import type { NextStepChoice } from "@/lib/db/schema";

export const MIN_GROUP_SIZE = 5;

export interface AttemptRow {
  studentId: string;
  calibration: Calibration;
  mistakeTag: MistakeTag | null;
  isCorrect: boolean;
  confidence: Confidence;
}

export interface NextStepRow {
  chosen: NextStepChoice;
}

export interface CalibrationCounts {
  match: number;
  over: number;
  under: number;
}

export function countByCalibration(attempts: AttemptRow[]): CalibrationCounts {
  const counts: CalibrationCounts = { match: 0, over: 0, under: 0 };
  for (const a of attempts) counts[a.calibration]++;
  return counts;
}

export interface MistakeTagCount {
  mistakeTag: MistakeTag;
  count: number;
}

export function countByMistakeTag(attempts: AttemptRow[]): MistakeTagCount[] {
  const counts = new Map<MistakeTag, number>();
  for (const a of attempts) {
    if (!a.isCorrect && a.mistakeTag) {
      counts.set(a.mistakeTag, (counts.get(a.mistakeTag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([mistakeTag, count]) => ({ mistakeTag, count }))
    .sort((a, b) => b.count - a.count);
}

export interface NextStepCount {
  chosen: NextStepChoice;
  count: number;
}

export function countByNextStep(nextSteps: NextStepRow[]): NextStepCount[] {
  const counts = new Map<NextStepChoice, number>();
  for (const n of nextSteps) counts.set(n.chosen, (counts.get(n.chosen) ?? 0) + 1);
  return [...counts.entries()]
    .map(([chosen, count]) => ({ chosen, count }))
    .sort((a, b) => b.count - a.count);
}

export type SupportReason = "over_lap_lai" | "luon_chon_1_muc";

export interface StudentSupportFlag {
  studentId: string;
  reasons: SupportReason[];
}

const OVER_REPEAT_THRESHOLD = 3;
const SAME_CONFIDENCE_MIN_ATTEMPTS = 4;

/**
 * Học sinh cần hỗ trợ nếu: (a) "over" (tự tin nhưng sai) lặp lại từ
 * OVER_REPEAT_THRESHOLD lần trở lên, hoặc (b) luôn chọn đúng 1 mức tự tin
 * suốt từ SAME_CONFIDENCE_MIN_ATTEMPTS lần làm bài trở lên (có thể đang
 * chọn qua loa, không thật sự cân nhắc).
 */
export function findStudentsNeedingSupport(attempts: AttemptRow[]): StudentSupportFlag[] {
  const byStudent = new Map<string, AttemptRow[]>();
  for (const a of attempts) {
    const list = byStudent.get(a.studentId) ?? [];
    list.push(a);
    byStudent.set(a.studentId, list);
  }

  const flags: StudentSupportFlag[] = [];
  for (const [studentId, studentAttempts] of byStudent) {
    const reasons: SupportReason[] = [];

    const overCount = studentAttempts.filter((a) => a.calibration === "over").length;
    if (overCount >= OVER_REPEAT_THRESHOLD) reasons.push("over_lap_lai");

    if (studentAttempts.length >= SAME_CONFIDENCE_MIN_ATTEMPTS) {
      const allSame = studentAttempts.every((a) => a.confidence === studentAttempts[0].confidence);
      if (allSame) reasons.push("luon_chon_1_muc");
    }

    if (reasons.length > 0) flags.push({ studentId, reasons });
  }
  return flags;
}

/** Số học sinh có ít nhất 1 lượt làm bài trong khoảng đang xem. */
export function countActiveStudents(attempts: AttemptRow[]): number {
  return new Set(attempts.map((a) => a.studentId)).size;
}

/** Bảo vệ riêng tư: ẩn số liệu khi nhóm có ít hơn MIN_GROUP_SIZE em. */
export function isGroupTooSmall(attempts: AttemptRow[]): boolean {
  return countActiveStudents(attempts) < MIN_GROUP_SIZE;
}
