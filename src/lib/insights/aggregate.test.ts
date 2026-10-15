import { describe, expect, it } from "vitest";
import {
  countActiveStudents,
  countByCalibration,
  countByMistakeTag,
  countByNextStep,
  findStudentsNeedingSupport,
  isGroupTooSmall,
  type AttemptRow,
} from "./aggregate";

function attempt(overrides: Partial<AttemptRow>): AttemptRow {
  return {
    studentId: "s1",
    calibration: "match",
    mistakeTag: null,
    isCorrect: true,
    confidence: 2,
    ...overrides,
  };
}

describe("countByCalibration", () => {
  it("đếm đúng từng mức", () => {
    const result = countByCalibration([
      attempt({ calibration: "match" }),
      attempt({ calibration: "over" }),
      attempt({ calibration: "over" }),
      attempt({ calibration: "under" }),
    ]);
    expect(result).toEqual({ match: 1, over: 2, under: 1 });
  });
});

describe("countByMistakeTag", () => {
  it("chỉ đếm lượt sai có mistake_tag, sắp xếp giảm dần", () => {
    const result = countByMistakeTag([
      attempt({ isCorrect: false, mistakeTag: "quen_nho" }),
      attempt({ isCorrect: false, mistakeTag: "quen_nho" }),
      attempt({ isCorrect: false, mistakeTag: "nham_hang_chuc" }),
      attempt({ isCorrect: true, mistakeTag: null }),
    ]);
    expect(result).toEqual([
      { mistakeTag: "quen_nho", count: 2 },
      { mistakeTag: "nham_hang_chuc", count: 1 },
    ]);
  });
});

describe("countByNextStep", () => {
  it("đếm theo lựa chọn, sắp xếp giảm dần", () => {
    const result = countByNextStep([
      { chosen: "practice" },
      { chosen: "practice" },
      { chosen: "harder" },
    ]);
    expect(result).toEqual([
      { chosen: "practice", count: 2 },
      { chosen: "harder", count: 1 },
    ]);
  });
});

describe("findStudentsNeedingSupport", () => {
  it("gắn cờ over_lap_lai khi over >= 3 lần", () => {
    const flags = findStudentsNeedingSupport([
      attempt({ studentId: "a", calibration: "over" }),
      attempt({ studentId: "a", calibration: "over" }),
      attempt({ studentId: "a", calibration: "over" }),
    ]);
    expect(flags).toEqual([{ studentId: "a", reasons: ["over_lap_lai"] }]);
  });

  it("gắn cờ luon_chon_1_muc khi >=4 lần cùng 1 mức tự tin", () => {
    const flags = findStudentsNeedingSupport([
      attempt({ studentId: "b", confidence: 3 }),
      attempt({ studentId: "b", confidence: 3 }),
      attempt({ studentId: "b", confidence: 3 }),
      attempt({ studentId: "b", confidence: 3 }),
    ]);
    expect(flags).toEqual([{ studentId: "b", reasons: ["luon_chon_1_muc"] }]);
  });

  it("học sinh bình thường không bị gắn cờ", () => {
    const flags = findStudentsNeedingSupport([
      attempt({ studentId: "c", confidence: 1, calibration: "under" }),
      attempt({ studentId: "c", confidence: 2, calibration: "match" }),
      attempt({ studentId: "c", confidence: 3, calibration: "match" }),
    ]);
    expect(flags).toEqual([]);
  });
});

describe("countActiveStudents / isGroupTooSmall", () => {
  it("đếm đúng số học sinh có dữ liệu", () => {
    const attempts = [attempt({ studentId: "a" }), attempt({ studentId: "a" }), attempt({ studentId: "b" })];
    expect(countActiveStudents(attempts)).toBe(2);
  });

  it("nhóm < 5 em bị coi là quá nhỏ để hiện số liệu", () => {
    const attempts = ["a", "b", "c"].map((studentId) => attempt({ studentId }));
    expect(isGroupTooSmall(attempts)).toBe(true);
  });

  it("nhóm >= 5 em thì hiện số liệu bình thường", () => {
    const attempts = ["a", "b", "c", "d", "e"].map((studentId) => attempt({ studentId }));
    expect(isGroupTooSmall(attempts)).toBe(false);
  });
});
