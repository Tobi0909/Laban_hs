import { describe, expect, it } from "vitest";
import { toPublicTask, type TaskRow } from "./public-task";

const taskRow: TaskRow & { answerKey: unknown; workedExample: unknown; explanation: unknown } = {
  id: "task-1",
  type: "number",
  difficulty: 1,
  prompt: "27 + 6 bằng mấy?",
  promptAudioUrl: null,
  content: { type: "number", maxDigits: 2 },
  // Các trường sau mô phỏng dữ liệu đầy đủ lấy từ DB — không được lọt ra public task.
  answerKey: { correct: { type: "number", value: 33 }, distractors: [] },
  workedExample: { steps: [{ text: "7 cộng 6 bằng 13, viết 3 nhớ 1", iconId: "sun" }] },
  explanation: { steps: [{ text: "Nhớ 1 sang hàng chục", iconId: "star" }] },
};

describe("toPublicTask", () => {
  it("không chứa answer_key/worked_example/explanation", () => {
    const publicTask = toPublicTask(taskRow);
    const serialized = JSON.stringify(publicTask);

    expect(publicTask).not.toHaveProperty("answerKey");
    expect(publicTask).not.toHaveProperty("workedExample");
    expect(publicTask).not.toHaveProperty("explanation");
    // Giá trị đáp án đúng (33) không được xuất hiện ở đâu trong payload công khai.
    expect(serialized).not.toContain("33");
    expect(serialized.toLowerCase()).not.toContain("answerkey");
  });

  it("vẫn giữ các trường cần để hiển thị đề bài", () => {
    const publicTask = toPublicTask(taskRow);
    expect(publicTask).toMatchObject({
      id: "task-1",
      type: "number",
      prompt: "27 + 6 bằng mấy?",
    });
  });
});
