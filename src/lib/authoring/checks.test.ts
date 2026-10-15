import { describe, expect, it } from "vitest";
import {
  checkBannedWords,
  checkReflectionBeforeApprove,
  checkReflectionMayLeakAnswer,
  checkSentenceLength,
  checkTaskBeforeApprove,
} from "./checks";

describe("checkSentenceLength", () => {
  it("lớp 1 câu <= 12 từ thì không cảnh báo", () => {
    expect(checkSentenceLength("Hai cộng ba bằng mấy", 1)).toBeNull();
  });

  it("lớp 1 câu > 12 từ thì cảnh báo", () => {
    const longText = "Một hai ba bốn năm sáu bảy tám chín mười mười một mười hai mười ba";
    expect(checkSentenceLength(longText, 1)?.code).toBe("too_long");
  });

  it("lớp 4 cho phép tới 20 từ", () => {
    const text = "Một hai ba bốn năm sáu bảy tám chín mười mười một mười hai mười ba mười bốn";
    expect(checkSentenceLength(text, 4)).toBeNull();
  });
});

describe("checkBannedWords", () => {
  it("phát hiện từ khen/chê năng lực", () => {
    expect(checkBannedWords("Em làm bài dốt quá")?.code).toBe("banned_word");
  });

  it("câu bình thường không cảnh báo", () => {
    expect(checkBannedWords("Em làm bài rất tốt hôm nay")).toBeNull();
  });
});

describe("checkReflectionMayLeakAnswer", () => {
  it("câu có số bị cảnh báo có thể lộ đáp án", () => {
    expect(checkReflectionMayLeakAnswer("Đáp án là 33 đúng không em?")?.code).toBe("leaks_answer");
  });

  it("câu không có số thì không cảnh báo", () => {
    expect(checkReflectionMayLeakAnswer("Em nghĩ sao về cách làm của mình?")).toBeNull();
  });
});

describe("checkTaskBeforeApprove", () => {
  it("gom cảnh báo từ nhiều câu", () => {
    const warnings = checkTaskBeforeApprove({
      grade: 1,
      texts: ["Một hai ba bốn năm sáu bảy tám chín mười mười một mười hai mười ba", "Em làm bài dốt quá"],
    });
    expect(warnings.map((w) => w.code)).toEqual(["too_long", "banned_word"]);
  });

  it("không có vấn đề thì trả mảng rỗng", () => {
    expect(checkTaskBeforeApprove({ grade: 2, texts: ["Hai cộng ba bằng mấy"] })).toEqual([]);
  });
});

describe("checkReflectionBeforeApprove", () => {
  it("gom đủ cảnh báo độ dài + từ cấm + lộ đáp án", () => {
    const warnings = checkReflectionBeforeApprove({
      grade: 1,
      question: "Một hai ba bốn năm sáu bảy tám chín mười mười một mười hai mười ba là 33 đúng không dốt",
    });
    expect(warnings.map((w) => w.code)).toEqual(["too_long", "banned_word", "leaks_answer"]);
  });
});
