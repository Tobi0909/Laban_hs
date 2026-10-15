import type { AnswerValue, Distractor, MistakeTag, TaskAnswerKey } from "./types";

export type Confidence = 1 | 2 | 3;
export type Calibration = "match" | "over" | "under";

/**
 * confidence 1 + đúng = under, 1 + sai = match
 * confidence 2/3 + đúng = match
 * confidence 2 + sai = over (nhẹ), confidence 3 + sai = over
 */
export function calibrate(confidence: Confidence, isCorrect: boolean): Calibration {
  if (confidence === 1) {
    return isCorrect ? "under" : "match";
  }
  return isCorrect ? "match" : "over";
}

function isSameAnswer(a: AnswerValue, b: AnswerValue): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "pick_image":
      return b.type === "pick_image" && a.optionId === b.optionId;
    case "number":
      return b.type === "number" && a.value === b.value;
    case "true_false":
      return b.type === "true_false" && a.value === b.value;
    case "order_steps":
      return (
        b.type === "order_steps" &&
        a.order.length === b.order.length &&
        a.order.every((id, i) => id === b.order[i])
      );
    case "drag_drop": {
      if (b.type !== "drag_drop") return false;
      const aKeys = Object.keys(a.mapping).sort();
      const bKeys = Object.keys(b.mapping).sort();
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((k, i) => k === bKeys[i] && a.mapping[k] === b.mapping[bKeys[i]]);
    }
  }
}

export interface GradeResult {
  isCorrect: boolean;
  mistakeTag: MistakeTag | null;
}

/** Chấm bài bằng code thuần — không bao giờ dùng AI để chấm. */
export function gradeAnswer(answerKey: TaskAnswerKey, submitted: AnswerValue): GradeResult {
  if (isSameAnswer(answerKey.correct, submitted)) {
    return { isCorrect: true, mistakeTag: null };
  }

  const matchedDistractor = answerKey.distractors.find((d: Distractor) => isSameAnswer(d.value, submitted));
  return { isCorrect: false, mistakeTag: matchedDistractor?.mistakeTag ?? "doan_lung_tung" };
}
