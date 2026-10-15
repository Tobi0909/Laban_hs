import type { Explanation, TaskContent, WorkedExample } from "@/lib/learning/types";
import type { ReflectionChoice } from "@/lib/learning/pick-reflection";

export interface AudioField {
  key: string;
  text: string;
  audioUrl?: string | null;
}

export interface TaskForAudio {
  prompt: string;
  promptAudioUrl?: string | null;
  content: TaskContent;
  workedExample: WorkedExample;
  explanation: Explanation;
}

/** Liệt kê mọi câu chữ của 1 bài cần có audio: đề, lựa chọn, ví dụ. */
export function listTaskAudioFields(task: TaskForAudio): AudioField[] {
  const fields: AudioField[] = [{ key: "prompt", text: task.prompt, audioUrl: task.promptAudioUrl }];

  if (task.content.type === "pick_image") {
    for (const opt of task.content.options) {
      fields.push({ key: `option:${opt.id}`, text: opt.label, audioUrl: opt.audioUrl });
    }
  }
  if (task.content.type === "order_steps") {
    for (const step of task.content.steps) {
      fields.push({ key: `step:${step.id}`, text: step.text, audioUrl: step.audioUrl });
    }
  }

  task.workedExample.steps.forEach((s, i) =>
    fields.push({ key: `workedExample:${i}`, text: s.text, audioUrl: s.audioUrl }),
  );
  task.explanation.steps.forEach((s, i) =>
    fields.push({ key: `explanation:${i}`, text: s.text, audioUrl: s.audioUrl }),
  );

  return fields;
}

export interface TaskAudioUpdate {
  promptAudioUrl?: string;
  options?: TaskContent;
  workedExample?: WorkedExample;
  explanation?: Explanation;
}

/** Áp 1 URL audio vào đúng trường của task theo `key` (từ listTaskAudioFields). */
export function applyTaskAudioUrl(task: TaskForAudio, key: string, url: string): TaskAudioUpdate {
  if (key === "prompt") return { promptAudioUrl: url };

  if (key.startsWith("option:")) {
    if (task.content.type !== "pick_image") {
      throw new Error("key 'option:' chỉ áp dụng cho bài dạng pick_image");
    }
    const id = key.slice("option:".length);
    const options = task.content.options.map((o) => (o.id === id ? { ...o, audioUrl: url } : o));
    return { options: { ...task.content, options } };
  }

  if (key.startsWith("step:")) {
    if (task.content.type !== "order_steps") {
      throw new Error("key 'step:' chỉ áp dụng cho bài dạng order_steps");
    }
    const id = key.slice("step:".length);
    const steps = task.content.steps.map((s) => (s.id === id ? { ...s, audioUrl: url } : s));
    return { options: { ...task.content, steps } };
  }

  if (key.startsWith("workedExample:")) {
    const idx = Number(key.slice("workedExample:".length));
    const steps = task.workedExample.steps.map((s, i) => (i === idx ? { ...s, audioUrl: url } : s));
    return { workedExample: { steps } };
  }

  if (key.startsWith("explanation:")) {
    const idx = Number(key.slice("explanation:".length));
    const steps = task.explanation.steps.map((s, i) => (i === idx ? { ...s, audioUrl: url } : s));
    return { explanation: { steps } };
  }

  throw new Error(`Không nhận diện được key audio: ${key}`);
}

export interface ReflectionForAudio {
  question: string;
  questionAudioUrl?: string | null;
  choices: ReflectionChoice[];
}

/** Liệt kê câu chữ của 1 mẫu câu phản tư cần có audio: câu hỏi + các thẻ trả lời. */
export function listReflectionAudioFields(template: ReflectionForAudio): AudioField[] {
  return [
    { key: "question", text: template.question, audioUrl: template.questionAudioUrl },
    ...template.choices.map((c) => ({ key: `choice:${c.id}`, text: c.label, audioUrl: c.audioUrl })),
  ];
}

export interface ReflectionAudioUpdate {
  questionAudioUrl?: string;
  choices?: ReflectionChoice[];
}

export function applyReflectionAudioUrl(
  template: ReflectionForAudio,
  key: string,
  url: string,
): ReflectionAudioUpdate {
  if (key === "question") return { questionAudioUrl: url };

  if (key.startsWith("choice:")) {
    const id = key.slice("choice:".length);
    const choices = template.choices.map((c) => (c.id === id ? { ...c, audioUrl: url } : c));
    return { choices };
  }

  throw new Error(`Không nhận diện được key audio: ${key}`);
}
