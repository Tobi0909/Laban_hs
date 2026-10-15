import { describe, expect, it } from "vitest";
import { selectSessionTasks } from "./select-session-tasks";

describe("selectSessionTasks", () => {
  const tasks = [
    { id: "d1a", difficulty: 1 },
    { id: "d1b", difficulty: 1 },
    { id: "d1c", difficulty: 1 },
    { id: "d2a", difficulty: 2 },
    { id: "d2b", difficulty: 2 },
    { id: "d2c", difficulty: 2 },
    { id: "d3a", difficulty: 3 },
    { id: "d3b", difficulty: 3 },
    { id: "d3c", difficulty: 3 },
  ];

  it("lấy 5 bài, xen kẽ độ khó 1,2,3,1,2", () => {
    const selected = selectSessionTasks(tasks, 5);
    expect(selected.map((t) => t.id)).toEqual(["d1a", "d2a", "d3a", "d1b", "d2b"]);
  });

  it("không lấy quá số lượng có sẵn", () => {
    const selected = selectSessionTasks(tasks.slice(0, 2), 5);
    expect(selected).toHaveLength(2);
  });
});
