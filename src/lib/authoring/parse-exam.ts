import type { MistakeTag, PickImageOption } from "@/lib/learning/types";
import type { TaskFormInput } from "./derive-task";

export const MAX_EXAM_QUESTIONS = 100;

const QUESTION_RE = /^(?:câu|bài|question)\s*(\d+)\s*[:.)]?\s*(.*)$/i;
const OPTION_RE = /^([a-dA-D])\s*[.):]\s*(.+)$/;
const ANSWER_RE = /^(?:đáp\s*án|dap\s*an|answer)\s*[:.)]?\s*(.+)$/i;
// Không dùng \b sau "đề": \b trong JS chỉ coi [A-Za-z0-9_] là word-char nên
// không nhận ra ranh giới sau ký tự có dấu tiếng Việt, khiến regex không
// bao giờ khớp.
const TOPIC_HEADER_RE = /^chủ\s*đề\s*\d/i;
const ANSWER_SECTION_MARKER_RE = /^đáp\s*án\s+và\s+giải\s+thích$/i;
const TABLE_NUMBER_RE = /^(\d+)\.?$/;
const TABLE_LETTER_RE = /^([a-dA-D])\.?$/;

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
 *
 * Một số ngân hàng câu hỏi (vd. xuất từ Word) tách riêng phần "Câu hỏi" và
 * phần "ĐÁP ÁN VÀ GIẢI THÍCH" ở cuối file dưới dạng bảng theo từng chủ đề,
 * thay vì ghi "Đáp án" ngay dưới mỗi câu — `mergeAnswerKeyTable` nhận diện
 * mẫu này và chèn lại dòng "Đáp án" vào đúng câu trước khi parse.
 *
 * Không dùng AI — chỉ nhận dạng theo mẫu cố định, phần nào không khớp sẽ
 * bị bỏ qua và báo lại trong `warnings` để giáo viên tự bổ sung bằng tay.
 */
export function parseExamText(text: string): ParseExamResult {
  const lines = mergeAnswerKeyTable(text)
    .split(/\r?\n/)
    .map((l) => l.trim());
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

/**
 * Nếu file có phần "ĐÁP ÁN VÀ GIẢI THÍCH" riêng ở cuối (bảng Câu/Đáp
 * án/Giải thích theo từng "Chủ đề N."), chèn lại dòng "Đáp án: X" vào
 * ngay sau câu hỏi tương ứng ở phần đề bài. Khớp câu hỏi với đáp án theo
 * cặp (thứ tự chủ đề, số câu trong chủ đề đó) vì số câu thường lặp lại
 * (1, 2, 3...) ở mỗi chủ đề. Không tìm thấy mốc "ĐÁP ÁN VÀ GIẢI THÍCH" thì
 * trả nguyên văn bản gốc.
 */
function mergeAnswerKeyTable(text: string): string {
  const lines = text.split(/\r?\n/);
  const markerIdx = lines.findIndex((l) => ANSWER_SECTION_MARKER_RE.test(l.trim()));
  if (markerIdx === -1) return text;

  const questionLines = lines.slice(0, markerIdx);
  const answerLines = lines.slice(markerIdx + 1);

  const answerMap = buildAnswerKeyMap(answerLines);
  if (answerMap.size === 0) return text;

  return injectAnswerLines(questionLines, answerMap).join("\n");
}

function buildAnswerKeyMap(rawLines: string[]): Map<string, string> {
  // Mammoth chèn 1 dòng trống giữa mỗi ô bảng (mỗi ô là 1 đoạn riêng) nên
  // phải bỏ dòng trống trước khi ghép cặp "số câu" + "chữ cái đáp án".
  const lines = rawLines.map((l) => l.trim()).filter(Boolean);
  const map = new Map<string, string>();
  let topicIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (TOPIC_HEADER_RE.test(line)) {
      topicIndex++;
      continue;
    }

    const numberMatch = line.match(TABLE_NUMBER_RE);
    const letterMatch = lines[i + 1]?.match(TABLE_LETTER_RE);
    if (numberMatch && letterMatch) {
      map.set(`${topicIndex}:${numberMatch[1]}`, letterMatch[1].toUpperCase());
      i++; // bỏ qua dòng chữ cái đã dùng, phần giải thích theo sau sẽ tự bị bỏ qua ở vòng lặp tiếp
    }
  }

  return map;
}

function injectAnswerLines(lines: string[], answerMap: Map<string, string>): string[] {
  const output: string[] = [];
  let topicIndex = 0;
  let pendingAnswer: string | null = null;

  const flush = () => {
    if (pendingAnswer) output.push(`Đáp án: ${pendingAnswer}`);
    pendingAnswer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (TOPIC_HEADER_RE.test(line)) {
      flush();
      topicIndex++;
      output.push(rawLine);
      continue;
    }

    const qMatch = line.match(QUESTION_RE);
    if (qMatch) {
      flush();
      pendingAnswer = answerMap.get(`${topicIndex}:${qMatch[1]}`) ?? null;
    }
    output.push(rawLine);
  }
  flush();

  return output;
}
