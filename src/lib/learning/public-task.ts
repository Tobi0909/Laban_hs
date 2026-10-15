import type { TaskType } from "@/lib/db/schema";
import type { TaskContent } from "./types";

export interface TaskRow {
  id: string;
  type: TaskType;
  difficulty: number;
  prompt: string;
  promptAudioUrl: string | null;
  content: TaskContent;
}

export interface PublicTask {
  id: string;
  type: TaskType;
  difficulty: number;
  prompt: string;
  promptAudioUrl: string | null;
  content: TaskContent;
}

/**
 * Chuyển 1 task trong DB sang dạng gửi xuống client: KHÔNG bao giờ gồm
 * answer_key, worked_example, explanation — những trường này chỉ được trả
 * về (qua submitAnswer) sau khi học sinh đã nộp bài.
 */
export function toPublicTask(task: TaskRow): PublicTask {
  return {
    id: task.id,
    type: task.type,
    difficulty: task.difficulty,
    prompt: task.prompt,
    promptAudioUrl: task.promptAudioUrl,
    content: task.content,
  };
}

export function toPublicTasks(tasks: TaskRow[]): PublicTask[] {
  return tasks.map(toPublicTask);
}
