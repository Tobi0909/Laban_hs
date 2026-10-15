import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { classes, tasks, topics } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { TaskForm } from "../TaskForm";
import { AudioFieldRow } from "../AudioFieldRow";
import { listTaskAudioFields, type TaskForAudio } from "@/lib/authoring/audio-fields";
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

  const taskForAudio: TaskForAudio = {
    prompt: task.prompt,
    promptAudioUrl: task.promptAudioUrl,
    content: task.options as TaskContent,
    workedExample: task.workedExample as WorkedExample,
    explanation: task.explanation as Explanation,
  };
  const audioFields = listTaskAudioFields(taskForAudio);

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

      <section className="mt-10">
        <h2 className="mb-2 font-medium">Audio (sinh khi Duyệt — có thể nghe thử/tạo lại/tải lên tay)</h2>
        {task.status !== "approved" && (
          <p className="mb-2 text-sm text-ink/50">Bài chưa duyệt nên chưa có audio. Bấm &ldquo;Duyệt&rdquo; ở trên để sinh.</p>
        )}
        <div className="rounded border border-border p-3">
          {audioFields.map((f) => (
            <AudioFieldRow key={f.key} kind="task" id={task.id} fieldKey={f.key} text={f.text} audioUrl={f.audioUrl} />
          ))}
        </div>
      </section>
    </main>
  );
}
