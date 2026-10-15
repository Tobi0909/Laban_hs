import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { classes, reflectionTemplates, tasks, topics } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { synthesizeAndUpload } from "@/lib/tts";
import {
  applyReflectionAudioUrl,
  applyTaskAudioUrl,
  listReflectionAudioFields,
  listTaskAudioFields,
  type TaskForAudio,
} from "@/lib/authoring/audio-fields";
import type { Explanation, TaskContent, WorkedExample } from "@/lib/learning/types";
import type { ReflectionChoice } from "@/lib/learning/pick-reflection";

const bodySchema = z.object({
  kind: z.enum(["task", "reflection"]),
  id: z.string().uuid(),
  key: z.string().optional(),
});

async function assertTaskOwnedByTeacher(taskId: string, teacherId: string) {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  if (!task) throw new Error("not_found");
  const topic = await db.query.topics.findFirst({ where: eq(topics.id, task.topicId) });
  if (!topic) throw new Error("not_found");
  const classRow = await db.query.classes.findFirst({ where: eq(classes.id, topic.classId) });
  if (!classRow || classRow.teacherId !== teacherId) throw new Error("forbidden");
  return task;
}

export async function POST(request: Request) {
  let teacherId: string;
  try {
    ({ teacherId } = await requireTeacher());
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { kind, id, key } = parsed.data;

  try {
    if (kind === "task") {
      const task = await assertTaskOwnedByTeacher(id, teacherId);
      const taskForAudio: TaskForAudio = {
        prompt: task.prompt,
        content: task.options as TaskContent,
        workedExample: task.workedExample as WorkedExample,
        explanation: task.explanation as Explanation,
      };

      const fields = key
        ? listTaskAudioFields(taskForAudio).filter((f) => f.key === key)
        : listTaskAudioFields(taskForAudio);
      if (fields.length === 0) {
        return NextResponse.json({ error: "field_not_found" }, { status: 400 });
      }

      let current = taskForAudio;
      const updates: Record<string, unknown> = {};
      for (const field of fields) {
        const url = await synthesizeAndUpload(field.text, `task-${id}-${field.key}`);
        const patch = applyTaskAudioUrl(current, field.key, url);
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

      await db.update(tasks).set(updates).where(eq(tasks.id, id));
      const updated = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
      return NextResponse.json({ task: updated });
    }

    // kind === "reflection"
    const template = await db.query.reflectionTemplates.findFirst({ where: eq(reflectionTemplates.id, id) });
    if (!template) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const templateForAudio = { question: template.question, choices: template.choices as ReflectionChoice[] };
    const fields = key
      ? listReflectionAudioFields(templateForAudio).filter((f) => f.key === key)
      : listReflectionAudioFields(templateForAudio);
    if (fields.length === 0) {
      return NextResponse.json({ error: "field_not_found" }, { status: 400 });
    }

    let current = templateForAudio;
    const updates: Record<string, unknown> = {};
    for (const field of fields) {
      const url = await synthesizeAndUpload(field.text, `reflection-${id}-${field.key}`);
      const patch = applyReflectionAudioUrl(current, field.key, url);
      if (patch.questionAudioUrl) updates.questionAudioUrl = patch.questionAudioUrl;
      if (patch.choices) {
        updates.choices = patch.choices;
        current = { ...current, choices: patch.choices };
      }
    }

    await db.update(reflectionTemplates).set(updates).where(eq(reflectionTemplates.id, id));
    const updated = await db.query.reflectionTemplates.findFirst({ where: eq(reflectionTemplates.id, id) });
    return NextResponse.json({ reflectionTemplate: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    console.error("TTS generate failed", error);
    return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  }
}
