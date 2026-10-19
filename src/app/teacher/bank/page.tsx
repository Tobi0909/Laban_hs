import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classes, tasks as tasksTable } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { NewTopicForm } from "./NewTopicForm";
import { ImportQuestionsForm } from "./ImportQuestionsForm";
import { DeleteTaskButton } from "./DeleteTaskButton";

export default async function BankPage() {
  const { teacherId } = await requireTeacher();

  const myClasses = await db.query.classes.findMany({ where: eq(classes.teacherId, teacherId) });
  const classIds = new Set(myClasses.map((c) => c.id));

  const allTopics = await db.query.topics.findMany();
  const myTopics = allTopics.filter((t) => classIds.has(t.classId));

  const topicsWithTasks = await Promise.all(
    myTopics.map(async (topic) => {
      const topicTasks = await db.query.tasks.findMany({ where: eq(tasksTable.topicId, topic.id) });
      const className = myClasses.find((c) => c.id === topic.classId)?.name ?? "";
      return { topic, className, tasks: topicTasks };
    }),
  );

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-sky-deep">Ngân hàng bài — soạn &amp; duyệt</h1>
        <Link href="/teacher/bank/reflections" className="text-sm text-sky-deep underline">
          Câu phản tư →
        </Link>
      </div>

      {myClasses.length > 0 && <NewTopicForm classes={myClasses.map((c) => ({ id: c.id, name: c.name }))} />}

      {topicsWithTasks.length === 0 && (
        <p className="text-ink/60">Chưa có chủ đề nào — tạo chủ đề ở trên để bắt đầu soạn bài.</p>
      )}

      {topicsWithTasks.map(({ topic, className, tasks: topicTasks }) => (
        <section key={topic.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">
              {topic.title} <span className="text-sm text-ink/50">— lớp {className}</span>
            </h2>
            <Link
              href={`/teacher/bank/new?topicId=${topic.id}`}
              className="rounded bg-sky-deep px-3 py-1.5 text-sm font-medium text-white"
            >
              + Bài mới
            </Link>
          </div>

          <ImportQuestionsForm topicId={topic.id} />

          {topicTasks.length === 0 ? (
            <p className="text-sm text-ink/50">Chưa có bài nào.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-ink/50">
                  <th className="py-1">Đề bài</th>
                  <th>Dạng</th>
                  <th>Độ khó</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {topicTasks.map((t) => (
                  <tr key={t.id} className="border-b border-border/50">
                    <td className="max-w-xs truncate py-2">{t.prompt}</td>
                    <td>{t.type}</td>
                    <td>{t.difficulty}</td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.status === "approved" ? "bg-leaf/20 text-[#2E7A4F]" : "bg-sun/20 text-[#8A6A14]"
                        }`}
                      >
                        {t.status === "approved" ? "Đã duyệt" : "Nháp"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Link href={`/teacher/bank/${t.id}`} className="text-sky-deep underline">
                          Sửa
                        </Link>
                        <DeleteTaskButton taskId={t.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </main>
  );
}
