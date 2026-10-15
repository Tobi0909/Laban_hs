"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { classes, reflectionTemplates, tasks, topics } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { deriveTask, type TaskFormInput } from "@/lib/authoring/derive-task";
import {
  applyReflectionAudioUrl,
  applyTaskAudioUrl,
  listReflectionAudioFields,
  listTaskAudioFields,
  type TaskForAudio,
} from "@/lib/authoring/audio-fields";
import { synthesizeAndUpload } from "@/lib/tts";
import type { Explanation, StepExplanationItem, TaskContent, WorkedExample } from "@/lib/learning/types";
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

async function generateAllTaskAudio(taskId: string) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) return;

  const taskForAudio: TaskForAudio = {
    prompt: task.prompt,
    content: task.options as TaskContent,
    workedExample: task.workedExample as WorkedExample,
    explanation: task.explanation as Explanation,
  };
  const fields = listTaskAudioFields(taskForAudio);

  const results = await Promise.allSettled(
    fields.map((f) => synthesizeAndUpload(f.text, `task-${taskId}-${f.key}`).then((url) => ({ key: f.key, url }))),
  );

  let current = taskForAudio;
  const updates: Record<string, unknown> = {};
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const patch = applyTaskAudioUrl(current, result.value.key, result.value.url);
    if (patch.promptAudioUrl) updates.promptAudioUrl = patch.promptAudioUrl;
    if (patch.options) {
      updates.options = patch.options;
      current = { ...current, content: patch.options };
    }
    if (patch.workedExample) {
      updates.workedExample = patch.workedExample;
      current = { ...current, workedExample: patch.workedExample };
    }
    if (patch.explanation) {
      updates.explanation = patch.explanation;
      current = { ...current, explanation: patch.explanation };
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
  }
}

export async function approveTask(taskId: string) {
  const { teacherId } = await requireTeacher();
  await assertTaskOwnedByTeacher(taskId, teacherId);

  await db
    .update(tasks)
    .set({ status: "approved", approvedBy: teacherId, approvedAt: new Date() })
    .where(eq(tasks.id, taskId));

  await generateAllTaskAudio(taskId);

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

  const template = await db.query.reflectionTemplates.findFirst({ where: eq(reflectionTemplates.id, id) });
  if (template) {
    const templateForAudio = { question: template.question, choices: template.choices as ReflectionChoice[] };
    const fields = listReflectionAudioFields(templateForAudio);
    const results = await Promise.allSettled(
      fields.map((f) =>
        synthesizeAndUpload(f.text, `reflection-${id}-${f.key}`).then((url) => ({ key: f.key, url })),
      ),
    );

    let current = templateForAudio;
    const updates: Record<string, unknown> = {};
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const patch = applyReflectionAudioUrl(current, result.value.key, result.value.url);
      if (patch.questionAudioUrl) updates.questionAudioUrl = patch.questionAudioUrl;
      if (patch.choices) {
        updates.choices = patch.choices;
        current = { ...current, choices: patch.choices };
      }
    }
    if (Object.keys(updates).length > 0) {
      await db.update(reflectionTemplates).set(updates).where(eq(reflectionTemplates.id, id));
    }
  }

  revalidatePath("/teacher/bank/reflections");
}
