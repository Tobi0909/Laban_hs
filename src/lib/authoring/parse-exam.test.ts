import { describe, expect, it } from "vitest";
import { parseExamText } from "./parse-exam";

describe("parseExamText", () => {
  it("tách đúng câu trắc nghiệm A-D và câu tự luận trong cùng 1 file", () => {
    const text = `Câu 1: 27 cộng 6 bằng mấy?
A. 32
B. 33
C. 34
D. 35
Đáp án: B

Câu 2: 15 cộng 8 bằng mấy?
Đáp án: 23`;

    const { questions, warnings } = parseExamText(text);
    expect(warnings).toEqual([]);
    expect(questions).toHaveLength(2);

    const [q1, q2] = questions;
    expect(q1.prompt).toBe("27 cộng 6 bằng mấy?");
    expect(q1.formInput).toMatchObject({ type: "pick_image", correctOptionId: "opt-1-B" });
    if (q1.formInput.type === "pick_image") {
      expect(q1.formInput.options.map((o) => o.label)).toEqual(["32", "33", "34", "35"]);
    }

    expect(q2.prompt).toBe("15 cộng 8 bằng mấy?");
    expect(q2.formInput).toMatchObject({ type: "number", correctValue: 23, maxDigits: 2 });
  });

  it("nhận dạng đáp án ghi theo nội dung lựa chọn thay vì chữ cái", () => {
    const text = `Câu 1: Đâu là số chẵn?
A. 3
B. 5
C. 4
D. 7
Đáp án: 4`;

    const { questions } = parseExamText(text);
    expect(questions).toHaveLength(1);
    expect(questions[0].formInput).toMatchObject({ type: "pick_image", correctOptionId: "opt-2-C" });
  });

  it("bỏ qua câu thiếu dòng Đáp án và báo warning", () => {
    const text = `Câu 1: 10 cộng 5 bằng mấy?
A. 14
B. 15
C. 16
D. 17`;

    const { questions, warnings } = parseExamText(text);
    expect(questions).toHaveLength(0);
    expect(warnings).toEqual(['Câu 1: thiếu dòng "Đáp án", đã bỏ qua.']);
  });

  it("bỏ qua câu tự luận có đáp án không phải số", () => {
    const text = `Câu 1: Vì sao bầu trời màu xanh?
Đáp án: vì ánh sáng tán xạ`;

    const { questions, warnings } = parseExamText(text);
    expect(questions).toHaveLength(0);
    expect(warnings).toEqual(["Câu 1: đáp án không phải là số, đã bỏ qua."]);
  });

  it("bỏ qua câu trắc nghiệm có đáp án không khớp lựa chọn nào", () => {
    const text = `Câu 1: 2 cộng 2 bằng mấy?
A. 3
B. 4
C. 5
D. 6
Đáp án: E`;

    const { questions, warnings } = parseExamText(text);
    expect(questions).toHaveLength(0);
    expect(warnings).toEqual(["Câu 1: đáp án không khớp với lựa chọn A-D nào, đã bỏ qua."]);
  });

  it("bỏ qua nội dung trước câu hỏi đầu tiên và dòng rác không khớp mẫu", () => {
    const text = `ĐỀ KIỂM TRA GIỮA KỲ — TOÁN LỚP 2

Câu 1: 9 cộng 4 bằng mấy?
A. 12
B. 13
C. 14
D. 15
Đáp án: B
(giải thích: 9 + 4 = 13)`;

    const { questions } = parseExamText(text);
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe("9 cộng 4 bằng mấy?");
  });
});
