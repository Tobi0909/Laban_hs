import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { classes, topics } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { TaskForm } from "../TaskForm";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string }>;
}) {
  const { teacherId } = await requireTeacher();
  const { topicId } = await searchParams;
  if (!topicId) notFound();

  const topic = await db.query.topics.findFirst({ where: eq(topics.id, topicId) });
  if (!topic) notFound();
  const classRow = await db.query.classes.findFirst({ where: eq(classes.id, topic.classId) });
  if (!classRow || classRow.teacherId !== teacherId) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-sky-deep">
        Bài mới — {topic.title} (lớp {classRow.name})
      </h1>
      <TaskForm topicId={topicId} grade={classRow.grade} mode="create" />
    </main>
  );
}
