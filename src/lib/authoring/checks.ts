export interface AuthoringWarning {
  code: "too_long" | "banned_word" | "leaks_answer";
  message: string;
}

/** Số từ khuyến nghị tối đa: lớp 1–2 dưới 12 từ, lớp 3–5 dưới 20 từ. */
const WORD_LIMIT_BY_GRADE: Record<number, number> = { 1: 12, 2: 12, 3: 20, 4: 20, 5: 20 };

/** Từ đánh giá/xếp hạng năng lực học sinh — sản phẩm không khen/chê năng lực. */
const BANNED_WORDS = ["giỏi nhất", "kém nhất", "dốt", "ngu", "tệ quá", "thông minh nhất", "thua kém"];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function checkSentenceLength(text: string, grade: number): AuthoringWarning | null {
  const limit = WORD_LIMIT_BY_GRADE[grade] ?? 20;
  const words = countWords(text);
  if (words > limit) {
    return {
      code: "too_long",
      message: `Câu có ${words} từ, vượt quá ${limit} từ khuyến nghị cho lớp ${grade}: "${text}"`,
    };
  }
  return null;
}

export function checkBannedWords(text: string): AuthoringWarning | null {
  const lower = text.toLowerCase();
  const found = BANNED_WORDS.find((w) => lower.includes(w));
  if (found) {
    return { code: "banned_word", message: `Câu chứa từ không phù hợp ("${found}"): "${text}"` };
  }
  return null;
}

/** Heuristic: câu phản tư chứa số dễ vô tình lộ đáp án (bài toán của ta là số). */
export function checkReflectionMayLeakAnswer(question: string): AuthoringWarning | null {
  if (/\d/.test(question)) {
    return {
      code: "leaks_answer",
      message: `Câu phản tư có chứa số, kiểm tra xem có vô tình tiết lộ đáp án không: "${question}"`,
    };
  }
  return null;
}

export function checkTaskBeforeApprove(input: { grade: number; texts: string[] }): AuthoringWarning[] {
  const warnings: AuthoringWarning[] = [];
  for (const text of input.texts) {
    if (!text) continue;
    const lengthWarning = checkSentenceLength(text, input.grade);
    if (lengthWarning) warnings.push(lengthWarning);
    const bannedWarning = checkBannedWords(text);
    if (bannedWarning) warnings.push(bannedWarning);
  }
  return warnings;
}

export function checkReflectionBeforeApprove(input: { question: string; grade: number }): AuthoringWarning[] {
  const warnings: AuthoringWarning[] = [];
  const lengthWarning = checkSentenceLength(input.question, input.grade);
  if (lengthWarning) warnings.push(lengthWarning);
  const bannedWarning = checkBannedWords(input.question);
  if (bannedWarning) warnings.push(bannedWarning);
  const leakWarning = checkReflectionMayLeakAnswer(input.question);
  if (leakWarning) warnings.push(leakWarning);
  return warnings;
}
