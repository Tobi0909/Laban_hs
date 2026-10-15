import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classes, reflectionTemplates, tasks, topics } from "@/lib/db/schema";
import { requireTeacher } from "@/lib/auth/guards";
import { uploadReplacementAudio } from "@/lib/tts";
import {
  applyReflectionAudioUrl,
  applyTaskAudioUrl,
  type TaskForAudio,
} from "@/lib/authoring/audio-fields";
import type { Explanation, TaskContent, WorkedExample } from "@/lib/learning/types";
import type { ReflectionChoice } from "@/lib/learning/pick-reflection";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"]);

/** Giáo viên tải lên 1 file tự ghi âm để thay thế audio TTS cho 1 câu chữ cụ thể. */
export async function POST(request: Request) {
  let teacherId: string;
  try {
    ({ teacherId } = await requireTeacher());
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const kind = form.get("kind");
  const id = form.get("id");
  const key = form.get("key");
  const file = form.get("file");

  if (
    (kind !== "task" && kind !== "reflection") ||
    typeof id !== "string" ||
    typeof key !== "string" ||
    !(file instanceof File)
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (kind === "task") {
      const task = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
      if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });
      const topic = await db.query.topics.findFirst({ where: eq(topics.id, task.topicId) });
      const classRow = topic ? await db.query.classes.findFirst({ where: eq(classes.id, topic.classId) }) : null;
      if (!classRow || classRow.teacherId !== teacherId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }

      const taskForAudio: TaskForAudio = {
        prompt: task.prompt,
        content: task.options as TaskContent,
        workedExample: task.workedExample as WorkedExample,
        explanation: task.explanation as Explanation,
      };
      const url = await uploadReplacementAudio(buffer, file.type, `task-${id}-${key}-upload`);
      const patch = applyTaskAudioUrl(taskForAudio, key, url);

      const updates: Record<string, unknown> = {};
      if (patch.promptAudioUrl) updates.promptAudioUrl = patch.promptAudioUrl;
      if (patch.options) updates.options = patch.options;
      if (patch.workedExample) updates.workedExample = patch.workedExample;
      if (patch.explanation) updates.explanation = patch.explanation;

      await db.update(tasks).set(updates).where(eq(tasks.id, id));
      const updated = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
      return NextResponse.json({ task: updated });
    }

    const template = await db.query.reflectionTemplates.findFirst({ where: eq(reflectionTemplates.id, id) });
    if (!template) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const templateForAudio = { question: template.question, choices: template.choices as ReflectionChoice[] };
    const url = await uploadReplacementAudio(buffer, file.type, `reflection-${id}-${key}-upload`);
    const patch = applyReflectionAudioUrl(templateForAudio, key, url);

    const updates: Record<string, unknown> = {};
    if (patch.questionAudioUrl) updates.questionAudioUrl = patch.questionAudioUrl;
    if (patch.choices) updates.choices = patch.choices;

    await db.update(reflectionTemplates).set(updates).where(eq(reflectionTemplates.id, id));
    const updated = await db.query.reflectionTemplates.findFirst({ where: eq(reflectionTemplates.id, id) });
    return NextResponse.json({ reflectionTemplate: updated });
  } catch (error) {
    console.error("TTS upload failed", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 502 });
  }
}
