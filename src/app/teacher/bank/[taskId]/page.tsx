import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { classes, tasks, topics } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { TaskForm } from "../TaskForm";
import type { Explanation, TaskAnswerKey, TaskContent, WorkedExample } from "@/lib/learning/types";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { teacherId } = await requireTeacher();
  const { taskId } = await params;

  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) notFound();
  const topic = await db.query.topics.findFirst({ where: eq(topics.id, task.topicId) });
  if (!topic) notFound();
  const classRow = await db.query.classes.findFirst({ where: eq(classes.id, topic.classId) });
  if (!classRow || classRow.teacherId !== teacherId) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-sky-deep">
        Sửa bài — {topic.title} (lớp {classRow.name})
      </h1>
      <TaskForm
        topicId={task.topicId}
        grade={classRow.grade}
        mode="edit"
        taskId={task.id}
        initialDifficulty={task.difficulty as 1 | 2 | 3}
        initialPrompt={task.prompt}
        initialType={task.type}
        initialContent={task.options as TaskContent}
        initialAnswerKey={task.answerKey as TaskAnswerKey}
        initialWorkedExample={(task.workedExample as WorkedExample).steps}
        initialExplanation={(task.explanation as Explanation).steps}
        initialStatus={task.status}
      />
    </main>
  );
}
