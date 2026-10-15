import { db } from "@/lib/db";
import { requireTeacher } from "@/lib/auth/guards";
import { listReflectionAudioFields } from "@/lib/authoring/audio-fields";
import { AudioFieldRow } from "../AudioFieldRow";
import { ApproveReflectionButton } from "./ApproveReflectionButton";
import { NewReflectionForm } from "./NewReflectionForm";
import type { ReflectionChoice } from "@/lib/learning/pick-reflection";
import { MISTAKE_TAG_LABELS_VI, type MistakeTag } from "@/lib/learning/types";

export default async function ReflectionsPage() {
  await requireTeacher();

  const templates = await db.query.reflectionTemplates.findMany();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <h1 className="text-2xl font-semibold text-sky-deep">Câu phản tư (dùng chung mọi lớp)</h1>

      <NewReflectionForm />

      <div className="flex flex-col gap-3">
        {templates.map((t) => {
          const choices = t.choices as ReflectionChoice[];
          const fields = listReflectionAudioFields({
            question: t.question,
            questionAudioUrl: t.questionAudioUrl,
            choices,
          });
          return (
            <section key={t.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded bg-sky/20 px-2 py-0.5 text-xs font-medium text-sky-deep">
                    {t.calibration}
                  </span>
                  {t.mistakeTag && (
                    <span className="ml-2 rounded bg-lavender/20 px-2 py-0.5 text-xs font-medium text-lavender">
                      {MISTAKE_TAG_LABELS_VI[t.mistakeTag as MistakeTag] ?? t.mistakeTag}
                    </span>
                  )}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.status === "approved" ? "bg-leaf/20 text-[#2E7A4F]" : "bg-sun/20 text-[#8A6A14]"
                    }`}
                  >
                    {t.status === "approved" ? "Đã duyệt" : "Nháp"}
                  </span>
                </div>
                {t.status !== "approved" && <ApproveReflectionButton id={t.id} />}
              </div>
              <p className="mt-2 font-medium">{t.question}</p>
              <ul className="mt-1 flex flex-wrap gap-2 text-sm text-ink/70">
                {choices.map((c) => (
                  <li key={c.id} className="rounded border border-border px-2 py-0.5">
                    {c.label}
                  </li>
                ))}
              </ul>
              {t.status === "approved" && (
                <div className="mt-3 border-t border-border pt-2">
                  {fields.map((f) => (
                    <AudioFieldRow key={f.key} kind="reflection" id={t.id} fieldKey={f.key} text={f.text} audioUrl={f.audioUrl} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
