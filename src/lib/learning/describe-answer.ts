import type { AnswerValue, TaskContent } from "./types";

/**
 * Diễn giải đáp án đúng thành câu tiếng Việt dễ hiểu — dùng làm phương án dự
 * phòng khi worked example/explanation của bài chưa có bước nào (vd. bài
 * mới import từ file, giáo viên chưa kịp điền).
 */
export function describeAnswer(content: TaskContent, correct: AnswerValue): string {
  switch (correct.type) {
    case "pick_image": {
      const option = content.type === "pick_image" ? content.options.find((o) => o.id === correct.optionId) : null;
      return option ? option.label : "";
    }
    case "drag_drop": {
      if (content.type !== "drag_drop") return "";
      const parts = Object.entries(correct.mapping).map(([itemId, targetId]) => {
        const item = content.items.find((i) => i.id === itemId);
        const target = content.targets.find((t) => t.id === targetId);
        return `${item?.label ?? "?"} → ${target?.label ?? "?"}`;
      });
      return parts.join(", ");
    }
    case "number":
      return String(correct.value);
    case "true_false":
      return correct.value ? "Đúng" : "Sai";
    case "order_steps": {
      if (content.type !== "order_steps") return "";
      return correct.order
        .map((id) => content.steps.find((s) => s.id === id)?.text ?? "?")
        .join(" → ");
    }
  }
}
