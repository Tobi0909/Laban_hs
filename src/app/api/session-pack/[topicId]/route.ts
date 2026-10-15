import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks as tasksTable, topics } from "@/lib/db/schema";
import { requireStudent } from "@/lib/auth/guards";
import { toPublicTasks, type TaskRow } from "@/lib/learning/public-task";
import { selectSessionTasks } from "@/lib/learning/select-session-tasks";
import type { TaskContent } from "@/lib/learning/types";

const SESSION_TASK_COUNT = 5;

/**
 * Trả gói đề cho 1 phiên học: KHÔNG bao giờ gồm answer_key, worked_example,
 * explanation (xem toPublicTask). Chỉ lấy bài đã duyệt (status='approved').
 */
export async function GET(_request: Request, { params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;

  let student: Awaited<ReturnType<typeof requireStudent>>;
  try {
    student = await requireStudent();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const topic = await db.query.topics.findFirst({ where: eq(topics.id, topicId) });
  if (!topic || topic.classId !== student.classId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const approvedTasks = await db.query.tasks.findMany({
    where: and(eq(tasksTable.topicId, topicId), eq(tasksTable.status, "approved")),
  });

  const taskRows: TaskRow[] = approvedTasks.map((t) => ({
    id: t.id,
    type: t.type,
    difficulty: t.difficulty,
    prompt: t.prompt,
    promptAudioUrl: t.promptAudioUrl,
    content: t.options as TaskContent,
  }));

  const sessionTasks = selectSessionTasks(taskRows, SESSION_TASK_COUNT);

  return NextResponse.json({
    topicId: topic.id,
    topicTitle: topic.title,
    tasks: toPublicTasks(sessionTasks),
  });
}
