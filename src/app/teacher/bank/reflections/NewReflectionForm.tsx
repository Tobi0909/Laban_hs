"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReflectionTemplate } from "../actions";
import { MISTAKE_TAG_LABELS_VI, MISTAKE_TAGS, type MistakeTag } from "@/lib/learning/types";
import type { Calibration } from "@/lib/learning/grade";

export function NewReflectionForm() {
  const router = useRouter();
  const [topicTitle, setTopicTitle] = useState("");
  const [grade, setGrade] = useState(2);
  const [aiBusy, setAiBusy] = useState(false);
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualCalibration, setManualCalibration] = useState<Calibration>("match");
  const [manualMistakeTag, setManualMistakeTag] = useState<MistakeTag | "">("");
  const [manualChoices, setManualChoices] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const suggestThree = async () => {
    setAiBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/author/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "reflections", topicTitle, grade }),
      });
      if (!res.ok) throw new Error("AI gợi ý thất bại.");
      const { output } = await res.json();
      for (const r of output.reflections as {
        calibration: Calibration;
        question: string;
        choices: { text: string }[];
      }[]) {
        await createReflectionTemplate({
          calibration: r.calibration,
          mistakeTag: null,
          question: r.question,
          choices: r.choices.map((c, i) => ({ id: `c${i}`, label: c.text })),
        });
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi AI");
    } finally {
      setAiBusy(false);
    }
  };

  const saveManual = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createReflectionTemplate({
          calibration: manualCalibration,
          mistakeTag: manualMistakeTag || null,
          question: manualQuestion,
          choices: manualChoices.filter(Boolean).map((label, i) => ({ id: `c${i}`, label })),
        });
        setManualQuestion("");
        setManualChoices(["", ""]);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lưu thất bại");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      {error && <p className="text-sm text-coral">{error}</p>}

      <div className="flex items-end gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Chủ đề (cho AI gợi ý)
          <input
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            className="rounded border border-border px-2 py-1.5"
            placeholder="VD: Phép cộng có nhớ trong phạm vi 100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Khối lớp
          <input
            type="number"
            min={1}
            max={5}
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="w-20 rounded border border-border px-2 py-1.5"
          />
        </label>
        <button
          type="button"
          onClick={suggestThree}
          disabled={aiBusy || !topicTitle}
          className="rounded bg-sky-deep px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {aiBusy ? "Đang gợi ý..." : "✦ AI: Gợi ý bộ 3 câu (match/over/under)"}
        </button>
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-2 text-sm font-medium">Hoặc soạn tay 1 câu</p>
        <div className="flex gap-3">
          <select
            value={manualCalibration}
            onChange={(e) => setManualCalibration(e.target.value as Calibration)}
            className="rounded border border-border px-2 py-1.5 text-sm"
          >
            <option value="match">match</option>
            <option value="over">over</option>
            <option value="under">under</option>
          </select>
          <select
            value={manualMistakeTag}
            onChange={(e) => setManualMistakeTag(e.target.value as MistakeTag | "")}
            className="rounded border border-border px-2 py-1.5 text-sm"
          >
            <option value="">(không gắn mistake_tag)</option>
            {MISTAKE_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {MISTAKE_TAG_LABELS_VI[tag]}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={manualQuestion}
          onChange={(e) => setManualQuestion(e.target.value)}
          rows={2}
          className="mt-2 w-full rounded border border-border px-2 py-1.5 text-sm"
          placeholder="Câu hỏi phản tư"
        />
        {manualChoices.map((c, i) => (
          <input
            key={i}
            value={c}
            onChange={(e) => {
              const next = [...manualChoices];
              next[i] = e.target.value;
              setManualChoices(next);
            }}
            className="mt-2 w-full rounded border border-border px-2 py-1.5 text-sm"
            placeholder={`Thẻ trả lời ${i + 1}`}
          />
        ))}
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => setManualChoices([...manualChoices, ""])}
            className="text-sm text-sky-deep underline"
          >
            + Thêm thẻ
          </button>
          <button
            type="button"
            onClick={saveManual}
            disabled={pending || !manualQuestion}
            className="rounded bg-sky-deep px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Đang lưu..." : "Lưu nháp"}
          </button>
        </div>
      </div>
    </div>
  );
}
