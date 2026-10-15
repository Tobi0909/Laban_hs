import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const STUDENT_ROUTE_DIRS = ["src/app/c", "src/app/s"];
const FORBIDDEN_PATTERNS = [/["']ai["']/, /@ai-sdk\//, /anthropic/i];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listFiles(full);
    return full.endsWith(".ts") || full.endsWith(".tsx") ? [full] : [];
  });
}

describe("route học sinh không import module AI", () => {
  const files = STUDENT_ROUTE_DIRS.flatMap((dir) => listFiles(dir));

  it("có quét được ít nhất 1 file route học sinh", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s không chứa import AI", (file) => {
    const content = readFileSync(file, "utf-8");
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(pattern.test(content)).toBe(false);
    }
  });
});
