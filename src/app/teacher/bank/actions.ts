"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { attempts, classes, reflectionTemplates, tasks, topics } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { deriveTask, type TaskFormInput } from "@/lib/authoring/derive-task";
import { parseImportFile } from "@/lib/authoring/parse-document";
import { parseExamText } from "@/lib/authoring/parse-exam";
import type { Explanation, StepExplanationItem, WorkedExample } from "@/lib/learning/types";
import type { ReflectionChoice } from "@/lib/learning/pick-reflection";
import type { Calibration } from "@/lib/learning/grade";

async function assertTopicOwnedByTeacher(topicId: string, teacherId: string) {
  const topic = await db.query.topics.findFirst({ where: eq(topics.id, topicId) });
  if (!topic) throw new Error("Không tìm thấy chủ đề.");
  const classRow = await db.query.classes.findFirst({ where: eq(classes.id, topic.classId) });
  if (!classRow || classRow.teacherId !== teacherId) throw new Error("Không có quyền trên chủ đề này.");
  return topic;
}

async function assertTaskOwnedByTeacher(taskId: string, teacherId: string) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new Error("Không tìm thấy bài.");
  await assertTopicOwnedByTeacher(task.topicId, teacherId);
  return task;
}

export async function createTopic(classId: string, title: string) {
  await requireTeacher(classId);
  const [created] = await db.insert(topics).values({ classId, title, order: 0 }).returning();
  revalidatePath("/teacher/bank");
  return created;
}

export interface TaskInput {
  difficulty: 1 | 2 | 3;
  prompt: string;
  formInput: TaskFormInput;
  workedExampleSteps: StepExplanationItem[];
  explanationSteps: StepExplanationItem[];
}

export async function createTask(topicId: string, input: TaskInput) {
  const { teacherId } = await requireTeacher();
  await assertTopicOwnedByTeacher(topicId, teacherId);

  const { content, answerKey } = deriveTask(input.formInput);

  const [created] = await db
    .insert(tasks)
    .values({
      topicId,
      difficulty: input.difficulty,
      type: input.formInput.type,
      prompt: input.prompt,
      options: content,
      answerKey,
      workedExample: { steps: input.workedExampleSteps } satisfies WorkedExample,
      explanation: { steps: input.explanationSteps } satisfies Explanation,
      status: "draft",
    })
    .returning();

  revalidatePath("/teacher/bank");
  return created;
}

export async function updateTask(taskId: string, input: TaskInput) {
  const { teacherId } = await requireTeacher();
  await assertTaskOwnedByTeacher(taskId, teacherId);

  const { content, answerKey } = deriveTask(input.formInput);

  await db
    .update(tasks)
    .set({
      difficulty: input.difficulty,
      type: input.formInput.type,
      prompt: input.prompt,
      options: content,
      answerKey,
      workedExample: { steps: input.workedExampleSteps } satisfies WorkedExample,
      explanation: { steps: input.explanationSteps } satisfies Explanation,
      // Sửa bài đã duyệt thì quay lại trạng thái Nháp để giáo viên duyệt lại nội dung mới.
      status: "draft",
      approvedBy: null,
      approvedAt: null,
    })
    .where(eq(tasks.id, taskId));

  revalidatePath("/teacher/bank");
  revalidatePath(`/teacher/bank/${taskId}`);
}

export async function approveTask(taskId: string) {
  const { teacherId } = await requireTeacher();
  await assertTaskOwnedByTeacher(taskId, teacherId);

  await db
    .update(tasks)
    .set({ status: "approved", approvedBy: teacherId, approvedAt: new Date() })
    .where(eq(tasks.id, taskId));

  revalidatePath("/teacher/bank");
  revalidatePath(`/teacher/bank/${taskId}`);
}

/**
 * Xoá hẳn 1 bài khỏi ngân hàng (vd. câu lỗi/không dùng sau khi import từ
 * file). `attempts.taskId` không cascade ở DB nên phải xoá attempts của
 * bài này trước; reflections/next_steps của các attempts đó tự cascade.
 */
export async function deleteTask(taskId: string) {
  const { teacherId } = await requireTeacher();
  await assertTaskOwnedByTeacher(taskId, teacherId);

  await db.delete(attempts).where(eq(attempts.taskId, taskId));
  await db.delete(tasks).where(eq(tasks.id, taskId));

  revalidatePath("/teacher/bank");
}

export interface ImportQuestionsResult {
  imported: number;
  warnings: string[];
}

/**
 * Giáo viên tải 1 file đề thi (.txt/.docx/.pdf) theo mẫu "Câu N / A-D /
 * Đáp án" (xem parseExamText) và tạo hàng loạt bài ở trạng thái "draft"
 * trong đúng chủ đề đã chọn — không dùng AI, chỉ nhận dạng theo mẫu cố
 * định. Giáo viên tự duyệt/sửa từng bài như bình thường (xem approveTask).
 */
export async function importQuestionsFromFile(topicId: string, formData: FormData): Promise<ImportQuestionsResult> {
  const { teacherId } = await requireTeacher();
  await assertTopicOwnedByTeacher(topicId, teacherId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Vui lòng chọn 1 file để tải lên.");
  }

  const text = await parseImportFile(file);
  const { questions, warnings } = parseExamText(text);

  const rows = questions.map(({ prompt, formInput }) => {
    const { content, answerKey } = deriveTask(formInput);
    return {
      topicId,
      difficulty: 1 as const,
      type: formInput.type,
      prompt,
      options: content,
      answerKey,
      workedExample: { steps: [] } satisfies WorkedExample,
      explanation: { steps: [] } satisfies Explanation,
      status: "draft" as const,
    };
  });

  if (rows.length > 0) {
    await db.insert(tasks).values(rows);
  }

  revalidatePath("/teacher/bank");
  return { imported: rows.length, warnings };
}

export interface ReflectionTemplateInput {
  calibration: Calibration;
  mistakeTag: string | null;
  question: string;
  choices: ReflectionChoice[];
}

export async function createReflectionTemplate(input: ReflectionTemplateInput) {
  await requireTeacher();
  const [created] = await db
    .insert(reflectionTemplates)
    .values({
      calibration: input.calibration,
      mistakeTag: input.mistakeTag,
      question: input.question,
      choices: input.choices,
      status: "draft",
    })
    .returning();
  revalidatePath("/teacher/bank/reflections");
  return created;
}

export async function updateReflectionTemplate(id: string, input: ReflectionTemplateInput) {
  await requireTeacher();
  await db
    .update(reflectionTemplates)
    .set({
      calibration: input.calibration,
      mistakeTag: input.mistakeTag,
      question: input.question,
      choices: input.choices,
      status: "draft",
      approvedBy: null,
      approvedAt: null,
    })
    .where(eq(reflectionTemplates.id, id));
  revalidatePath("/teacher/bank/reflections");
}

export async function approveReflectionTemplate(id: string) {
  const { teacherId } = await requireTeacher();

  await db
    .update(reflectionTemplates)
    .set({ status: "approved", approvedBy: teacherId, approvedAt: new Date() })
    .where(eq(reflectionTemplates.id, id));

  revalidatePath("/teacher/bank/reflections");
}
