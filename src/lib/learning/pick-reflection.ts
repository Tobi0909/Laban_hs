import type { Calibration } from "./grade";
import type { MistakeTag } from "./types";

export interface ReflectionChoice {
  id: string;
  label: string;
}

export interface ReflectionTemplateRow {
  id: string;
  calibration: Calibration;
  mistakeTag: string | null;
  question: string;
  questionAudioUrl: string | null;
  choices: ReflectionChoice[];
}

/**
 * Chọn 1 mẫu câu phản tư theo calibration (+ mistake_tag nếu có). Ưu tiên
 * mẫu khớp đúng mistake_tag; nếu không có thì dùng mẫu chung (mistakeTag
 * null). `seed` (vd. số thứ tự bài) giúp chọn xoay vòng, không luôn lấy
 * cùng 1 mẫu trong 1 phiên.
 */
export function pickReflectionTemplate(
  templates: ReflectionTemplateRow[],
  calibration: Calibration,
  mistakeTag: MistakeTag | null,
  seed = 0,
): ReflectionTemplateRow | null {
  const sameCalibration = templates.filter((t) => t.calibration === calibration);
  if (sameCalibration.length === 0) return null;

  const tagMatches = mistakeTag
    ? sameCalibration.filter((t) => t.mistakeTag === mistakeTag)
    : [];
  const pool = tagMatches.length > 0 ? tagMatches : sameCalibration.filter((t) => t.mistakeTag === null);
  const finalPool = pool.length > 0 ? pool : sameCalibration;

  const index = ((seed % finalPool.length) + finalPool.length) % finalPool.length;
  return finalPool[index];
}
