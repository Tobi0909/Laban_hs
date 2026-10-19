"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { classes, reflectionTemplates, tasks, topics } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { deriveTask, type TaskFormInput } from "@/lib/authoring/derive-task";
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
