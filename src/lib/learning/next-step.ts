import type { Confidence } from "./grade";
import type { NextStepChoice } from "@/lib/db/schema";

export interface NextStepSuggestion {
  suggested: NextStepChoice;
  reasonText: string;
}

const REASONS: Record<NextStepChoice, string> = {
  review_example: "Mình cùng xem lại ví dụ để hiểu rõ hơn nhé.",
  practice: "Luyện thêm một chút để em vững hơn nhé.",
  how_to: "Xem cách làm để nắm chắc các bước nhé.",
  harder: "Em làm tốt lắm, thử bài khó hơn xem sao!",
};

/**
 * sai → Xem lại ví dụ; đúng + tự tin 1 → Luyện thêm;
 * đúng + tự tin 3 → Thử bài khó hơn; còn lại → Luyện thêm.
 */
export function suggestNextStep(isCorrect: boolean, confidence: Confidence): NextStepSuggestion {
  let suggested: NextStepChoice;
  if (!isCorrect) {
    suggested = "review_example";
  } else if (confidence === 1) {
    suggested = "practice";
  } else if (confidence === 3) {
    suggested = "harder";
  } else {
    suggested = "practice";
  }
  return { suggested, reasonText: REASONS[suggested] };
}
