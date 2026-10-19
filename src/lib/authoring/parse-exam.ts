import type { MistakeTag, PickImageOption } from "@/lib/learning/types";
import type { TaskFormInput } from "./derive-task";

export const MAX_EXAM_QUESTIONS = 100;

const QUESTION_RE = /^(?:câu|bài|question)\s*(\d+)\s*[:.)]?\s*(.*)$/i;
const OPTION_RE = /^([a-dA-D])\s*[.):]\s*(.+)$/;
const ANSWER_RE = /^(?:đáp\s*án|dap\s*an|answer)\s*[:.)]?\s*(.+)$/i;

interface RawQuestion {
  number: number;
  promptLines: string[];
  options: { letter: string; text: string }[];
  answerRaw: string | null;
}

export interface ParsedExamQuestion {
  number: number;
  prompt: string;
  formInput: TaskFormInput;
}

export interface ParseExamResult {
  questions: ParsedExamQuestion[];
  warnings: string[];
}

/**
 * Tách text đề thi thành câu hỏi theo định dạng:
 *   Câu 1: <đề bài>
 *   A. <lựa chọn>
 *   B. <lựa chọn>
 *   ...
 *   Đáp án: B
 * (hoặc không có lựa chọn A-D ⇒ câu tự luận, "Đáp án" là 1 số)
 * Không dùng AI — chỉ nhận dạng theo mẫu câu cố định này, phần nào
 * không khớp sẽ bị bỏ qua và báo lại trong `warnings` để giáo viên tự bổ
 * sung bằng tay.
 */
export function parseExamText(text: string): ParseExamResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const raws: RawQuestion[] = [];
  let current: RawQuestion | null = null;

  for (const line of lines) {
    if (!line) continue;

    const qMatch = line.match(QUESTION_RE);
    if (qMatch) {
      if (current) raws.push(current);
      current = {
        number: Number(qMatch[1]),
        promptLines: qMatch[2] ? [qMatch[2].trim()] : [],
        options: [],
        answerRaw: null,
      };
      continue;
    }
    if (!current) continue;

    const aMatch = line.match(ANSWER_RE);
    if (aMatch) {
      current.answerRaw = aMatch[1].trim();
      continue;
    }
    if (current.answerRaw !== null) continue;

    const oMatch = line.match(OPTION_RE);
    if (oMatch) {
      current.options.push({ letter: oMatch[1].toUpperCase(), text: oMatch[2].trim() });
      continue;
    }

    if (current.options.length === 0) {
      current.promptLines.push(line);
    }
  }
  if (current) raws.push(current);

  const questions: ParsedExamQuestion[] = [];
  const warnings: string[] = [];

  for (const raw of raws.slice(0, MAX_EXAM_QUESTIONS)) {
    const prompt = raw.promptLines.join(" ").replace(/\s+/g, " ").trim();
    if (!prompt) {
      warnings.push(`Câu ${raw.number}: thiếu đề bài, đã bỏ qua.`);
      continue;
    }
    if (raw.answerRaw === null) {
      warnings.push(`Câu ${raw.number}: thiếu dòng "Đáp án", đã bỏ qua.`);
      continue;
    }

    if (raw.options.length >= 2) {
      const formInput = buildPickImageInput(raw);
      if (!formInput) {
        warnings.push(`Câu ${raw.number}: đáp án không khớp với lựa chọn A-D nào, đã bỏ qua.`);
        continue;
      }
      questions.push({ number: raw.number, prompt, formInput });
    } else {
      const formInput = buildNumberInput(raw.answerRaw);
      if (!formInput) {
        warnings.push(`Câu ${raw.number}: đáp án không phải là số, đã bỏ qua.`);
        continue;
      }
      questions.push({ number: raw.number, prompt, formInput });
    }
  }

  if (raws.length > MAX_EXAM_QUESTIONS) {
    warnings.push(`File có hơn ${MAX_EXAM_QUESTIONS} câu — chỉ lấy ${MAX_EXAM_QUESTIONS} câu đầu tiên.`);
  }

  return { questions, warnings };
}

function buildPickImageInput(raw: RawQuestion): TaskFormInput | null {
  const options: PickImageOption[] = raw.options.map((o, i) => ({
    id: `opt-${i}-${o.letter}`,
    iconId: "star",
    label: o.text,
  }));

  const answer = raw.answerRaw ?? "";
  const letterMatch = answer.match(/^([a-dA-D])\b/);
  let correctIndex = letterMatch
    ? raw.options.findIndex((o) => o.letter === letterMatch[1].toUpperCase())
    : -1;

  if (correctIndex === -1) {
    const normalizedAnswer = answer.trim().toLowerCase();
    correctIndex = raw.options.findIndex((o) => o.text.toLowerCase() === normalizedAnswer);
  }
  if (correctIndex === -1) return null;

  return {
    type: "pick_image",
    options,
    correctOptionId: options[correctIndex].id,
    distractorTags: {} as Record<string, MistakeTag>,
  };
}

function buildNumberInput(answerRaw: string): TaskFormInput | null {
  const match = answerRaw.match(/-?\d+/);
  if (!match) return null;
  const correctValue = Number(match[0]);
  if (!Number.isInteger(correctValue)) return null;

  return {
    type: "number",
    maxDigits: Math.max(2, String(Math.abs(correctValue)).length),
    correctValue,
    distractors: [],
  };
}
