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
