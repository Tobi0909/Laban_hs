import { describe, expect, it } from "vitest";
import {
  applyReflectionAudioUrl,
  applyTaskAudioUrl,
  listReflectionAudioFields,
  listTaskAudioFields,
  type TaskForAudio,
} from "./audio-fields";

const pickImageTask: TaskForAudio = {
  prompt: "9 cộng 4 bằng mấy?",
  content: {
    type: "pick_image",
    options: [
      { id: "opt12", iconId: "star", label: "12" },
      { id: "opt13", iconId: "star", label: "13" },
    ],
  },
  workedExample: { steps: [{ text: "Đếm thêm 4", iconId: "apple" }] },
  explanation: { steps: [{ text: "Qua 10 thì có 2 chữ số", iconId: "sun" }] },
};

const orderStepsTask: TaskForAudio = {
  prompt: "Sắp xếp các bước",
  content: {
    type: "order_steps",
    steps: [
      { id: "s1", text: "Bước 1", iconId: "star" },
      { id: "s2", text: "Bước 2", iconId: "sun" },
    ],
  },
  workedExample: { steps: [] },
  explanation: { steps: [] },
};

describe("listTaskAudioFields", () => {
  it("pick_image: gồm prompt + từng lựa chọn + ví dụ", () => {
    const fields = listTaskAudioFields(pickImageTask);
    expect(fields.map((f) => f.key)).toEqual([
      "prompt",
      "option:opt12",
      "option:opt13",
      "workedExample:0",
      "explanation:0",
    ]);
  });

  it("order_steps: gồm prompt + từng bước", () => {
    const fields = listTaskAudioFields(orderStepsTask);
    expect(fields.map((f) => f.key)).toEqual(["prompt", "step:s1", "step:s2"]);
  });
});

describe("applyTaskAudioUrl", () => {
  it("prompt → promptAudioUrl", () => {
    expect(applyTaskAudioUrl(pickImageTask, "prompt", "https://blob/p.mp3")).toEqual({
      promptAudioUrl: "https://blob/p.mp3",
    });
  });

  it("option:<id> → chỉ gắn audioUrl cho đúng option đó", () => {
    const result = applyTaskAudioUrl(pickImageTask, "option:opt13", "https://blob/o.mp3");
    expect(result.options).toMatchObject({
      type: "pick_image",
      options: [{ id: "opt12" }, { id: "opt13", audioUrl: "https://blob/o.mp3" }],
    });
  });

  it("step:<id> chỉ áp dụng cho order_steps, ném lỗi nếu sai dạng", () => {
    expect(() => applyTaskAudioUrl(pickImageTask, "step:s1", "x")).toThrow();
  });

  it("workedExample:<index> → gắn audioUrl đúng vị trí", () => {
    const result = applyTaskAudioUrl(pickImageTask, "workedExample:0", "https://blob/w.mp3");
    expect(result.workedExample?.steps[0].audioUrl).toBe("https://blob/w.mp3");
  });

  it("key không nhận diện được → ném lỗi", () => {
    expect(() => applyTaskAudioUrl(pickImageTask, "unknown:0", "x")).toThrow();
  });
});

describe("reflection audio fields", () => {
  const template = {
    question: "Em thấy sao về bài này?",
    choices: [
      { id: "c1", label: "Dễ" },
      { id: "c2", label: "Khó" },
    ],
  };

  it("listReflectionAudioFields gồm câu hỏi + từng thẻ", () => {
    expect(listReflectionAudioFields(template).map((f) => f.key)).toEqual(["question", "choice:c1", "choice:c2"]);
  });

  it("applyReflectionAudioUrl: question → questionAudioUrl", () => {
    expect(applyReflectionAudioUrl(template, "question", "https://blob/q.mp3")).toEqual({
      questionAudioUrl: "https://blob/q.mp3",
    });
  });

  it("applyReflectionAudioUrl: choice:<id> → chỉ gắn đúng thẻ", () => {
    const result = applyReflectionAudioUrl(template, "choice:c2", "https://blob/c2.mp3");
    expect(result.choices).toEqual([
      { id: "c1", label: "Dễ" },
      { id: "c2", label: "Khó", audioUrl: "https://blob/c2.mp3" },
    ]);
  });
});
