export interface DifficultyBearing {
  difficulty: number;
}

/**
 * Chọn tối đa `count` bài cho 1 phiên, xen kẽ theo độ khó (1,2,3,1,2,...)
 * để mỗi phiên có đủ độ khó khác nhau thay vì luôn lấy các bài dễ trước.
 */
export function selectSessionTasks<T extends DifficultyBearing>(tasks: T[], count = 5): T[] {
  const byDifficulty = new Map<number, T[]>();
  for (const task of tasks) {
    const list = byDifficulty.get(task.difficulty) ?? [];
    list.push(task);
    byDifficulty.set(task.difficulty, list);
  }
  const difficulties = [...byDifficulty.keys()].sort((a, b) => a - b);

  const result: T[] = [];
  let round = 0;
  while (result.length < count) {
    let addedThisRound = false;
    for (const d of difficulties) {
      const list = byDifficulty.get(d)!;
      if (round < list.length) {
        result.push(list[round]);
        addedThisRound = true;
        if (result.length >= count) break;
      }
    }
    if (!addedThisRound) break;
    round++;
  }
  return result;
}
