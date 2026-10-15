"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ICON_IDS, ICON_LABELS_VI, type IconId } from "@/components/kid/icons";
import { TaskScreen } from "@/app/learn/[topicId]/TaskScreen";
import type {
  DragItem,
  DragTarget,
  MistakeTag,
  PickImageOption,
  StepExplanationItem,
  TaskAnswerKey,
  TaskContent,
  TaskType,
} from "@/lib/learning/types";
import { MISTAKE_TAG_LABELS_VI, MISTAKE_TAGS } from "@/lib/learning/types";
import type { TaskFormInput } from "@/lib/authoring/derive-task";
import { checkTaskBeforeApprove, type AuthoringWarning } from "@/lib/authoring/checks";
import { createTask, updateTask, approveTask } from "./actions";

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  pick_image: "Chọn hình/số đúng",
  drag_drop: "Kéo thả",
  number: "Nhập số",
  true_false: "Đúng / Sai",
  order_steps: "Sắp xếp các bước",
};

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

interface StepRowsEditorProps {
  title: string;
  steps: StepExplanationItem[];
  onChange: (steps: StepExplanationItem[]) => void;
}

function StepRowsEditor({ title, steps, onChange }: StepRowsEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={step.iconId}
            onChange={(e) => {
              const next = [...steps];
              next[i] = { ...next[i], iconId: e.target.value as IconId };
              onChange(next);
            }}
            className="rounded border border-border px-2 py-1 text-sm"
          >
            {ICON_IDS.map((id) => (
              <option key={id} value={id}>
                {ICON_LABELS_VI[id]}
              </option>
            ))}
          </select>
          <input
            value={step.text}
            onChange={(e) => {
              const next = [...steps];
              next[i] = { ...next[i], text: e.target.value };
              onChange(next);
            }}
            className="flex-1 rounded border border-border px-2 py-1 text-sm"
            placeholder="Nội dung bước"
          />
          <button
            type="button"
            onClick={() => onChange(steps.filter((_, j) => j !== i))}
            className="text-sm text-coral"
          >
            Xoá
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...steps, { text: "", iconId: "star" }])}
        className="self-start text-sm text-sky-deep underline"
      >
        + Thêm bước
      </button>
    </div>
  );
}

export type BuilderState =
  | { type: "pick_image"; options: PickImageOption[]; correctOptionId: string; distractorTags: Record<string, MistakeTag> }
  | { type: "number"; maxDigits: number; correctValue: string; distractors: { value: string; mistakeTag: MistakeTag }[] }
  | { type: "true_false"; correctValue: boolean }
  | { type: "drag_drop"; items: DragItem[]; targets: DragTarget[]; correctMapping: Record<string, string> }
  | { type: "order_steps"; steps: StepExplanationItem[] };

function defaultBuilder(type: TaskType): BuilderState {
  switch (type) {
    case "pick_image":
      return {
        type,
        options: [
          { id: newId("opt"), iconId: "star", label: "" },
          { id: newId("opt"), iconId: "star", label: "" },
        ],
        correctOptionId: "",
        distractorTags: {},
      };
    case "number":
      return { type, maxDigits: 2, correctValue: "", distractors: [] };
    case "true_false":
      return { type, correctValue: true };
    case "drag_drop":
      return {
        type,
        items: [{ id: newId("item"), label: "" }],
        targets: [{ id: newId("target"), label: "" }],
        correctMapping: {},
      };
    case "order_steps":
      return { type, steps: [{ text: "", iconId: "star" }] };
  }
}

function builderToFormInput(builder: BuilderState): TaskFormInput {
  if (builder.type === "order_steps") {
    return {
      type: "order_steps",
      stepsInCorrectOrder: builder.steps.map((s, i) => ({ id: newId(`s${i}`), text: s.text, iconId: s.iconId })),
    };
  }
  if (builder.type === "number") {
    return {
      type: "number",
      maxDigits: builder.maxDigits,
      correctValue: Number(builder.correctValue) || 0,
      distractors: builder.distractors
        .filter((d) => d.value !== "")
        .map((d) => ({ value: Number(d.value) || 0, mistakeTag: d.mistakeTag })),
    };
  }
  return builder;
}

function previewContent(builder: BuilderState): TaskContent {
  switch (builder.type) {
    case "pick_image":
      return { type: "pick_image", options: builder.options };
    case "number":
      return { type: "number", maxDigits: builder.maxDigits };
    case "true_false":
      return { type: "true_false" };
    case "drag_drop":
      return { type: "drag_drop", items: builder.items, targets: builder.targets };
    case "order_steps":
      return {
        type: "order_steps",
        steps: builder.steps.map((s, i) => ({ id: `preview_${i}`, text: s.text, iconId: s.iconId })),
      };
  }
}

export interface TaskFormProps {
  topicId: string;
  grade: number;
  mode: "create" | "edit";
  taskId?: string;
  initialDifficulty?: 1 | 2 | 3;
  initialPrompt?: string;
  initialType?: TaskType;
  initialContent?: TaskContent;
  initialAnswerKey?: TaskAnswerKey;
  initialWorkedExample?: StepExplanationItem[];
  initialExplanation?: StepExplanationItem[];
  initialStatus?: "draft" | "approved";
}

function reconstructBuilder(type: TaskType, content?: TaskContent, answerKey?: TaskAnswerKey): BuilderState {
  if (!content || !answerKey) return defaultBuilder(type);

  if (content.type === "pick_image" && answerKey.correct.type === "pick_image") {
    const distractorTags: Record<string, MistakeTag> = {};
    for (const d of answerKey.distractors) {
      if (d.value.type === "pick_image") distractorTags[d.value.optionId] = d.mistakeTag;
    }
    return {
      type: "pick_image",
      options: content.options,
      correctOptionId: answerKey.correct.optionId,
      distractorTags,
    };
  }
  if (content.type === "number" && answerKey.correct.type === "number") {
    return {
      type: "number",
      maxDigits: content.maxDigits,
      correctValue: String(answerKey.correct.value),
      distractors: answerKey.distractors
        .filter((d) => d.value.type === "number")
        .map((d) => ({ value: String((d.value as { value: number }).value), mistakeTag: d.mistakeTag })),
    };
  }
  if (content.type === "true_false" && answerKey.correct.type === "true_false") {
    return { type: "true_false", correctValue: answerKey.correct.value };
  }
  if (content.type === "drag_drop" && answerKey.correct.type === "drag_drop") {
    return {
      type: "drag_drop",
      items: content.items,
      targets: content.targets,
      correctMapping: answerKey.correct.mapping,
    };
  }
  if (content.type === "order_steps" && answerKey.correct.type === "order_steps") {
    const byId = new Map(content.steps.map((s) => [s.id, s]));
    const steps = answerKey.correct.order
      .map((id) => byId.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ text: s.text, iconId: s.iconId }));
    return { type: "order_steps", steps };
  }
  return defaultBuilder(type);
}

export function TaskForm(props: TaskFormProps) {
  const router = useRouter();
  const [type, setType] = useState<TaskType>(props.initialType ?? "number");
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(props.initialDifficulty ?? 1);
  const [prompt, setPrompt] = useState(props.initialPrompt ?? "");
  const [builder, setBuilder] = useState<BuilderState>(() =>
    reconstructBuilder(type, props.initialContent, props.initialAnswerKey),
  );
  const [workedExampleSteps, setWorkedExampleSteps] = useState<StepExplanationItem[]>(
    props.initialWorkedExample ?? [],
  );
  const [explanationSteps, setExplanationSteps] = useState<StepExplanationItem[]>(props.initialExplanation ?? []);

  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [approving, startApproving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const warnings: AuthoringWarning[] = useMemo(() => {
    const texts = [
      prompt,
      ...workedExampleSteps.map((s) => s.text),
      ...explanationSteps.map((s) => s.text),
      ...(builder.type === "pick_image" ? builder.options.map((o) => o.label) : []),
      ...(builder.type === "order_steps" ? builder.steps.map((s) => s.text) : []),
      ...(builder.type === "drag_drop" ? [...builder.items.map((i) => i.label), ...builder.targets.map((t) => t.label)] : []),
    ];
    return checkTaskBeforeApprove({ grade: props.grade, texts });
  }, [prompt, workedExampleSteps, explanationSteps, builder, props.grade]);

  const previewTask = {
    id: "preview",
    type,
    difficulty,
    prompt: prompt || "(chưa nhập đề bài)",
    promptAudioUrl: null,
    content: previewContent(builder),
  };

  async function callSuggest(kind: string, extra: Record<string, unknown>) {
    setAiBusy(kind);
    setError(null);
    try {
      const res = await fetch("/api/author/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, grade: props.grade, ...extra }),
      });
      if (!res.ok) throw new Error("AI gợi ý thất bại, thử lại nhé.");
      const { output } = await res.json();
      return output;
    } finally {
      setAiBusy(null);
    }
  }

  const suggestSimplify = async () => {
    try {
      const output = await callSuggest("simplify", { text: prompt });
      if (output?.text) setPrompt(output.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi AI");
    }
  };

  const suggestDistractors = async () => {
    try {
      const correctDescription =
        builder.type === "number"
          ? `Số đúng là ${builder.correctValue}`
          : builder.type === "pick_image"
            ? `Lựa chọn đúng là "${builder.options.find((o) => o.id === builder.correctOptionId)?.label ?? ""}"`
            : "";
      const output = await callSuggest("distractors", { prompt, correctAnswerDescription: correctDescription });
      if (!output?.distractors) return;
      if (builder.type === "number") {
        setBuilder({
          ...builder,
          distractors: output.distractors.map((d: { text: string; mistake_tag: MistakeTag }) => ({
            value: d.text,
            mistakeTag: d.mistake_tag,
          })),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi AI");
    }
  };

  const suggestSteps = async () => {
    try {
      const correctDescription = builder.type === "number" ? `Số đúng là ${builder.correctValue}` : "";
      const output = await callSuggest("steps", { prompt, correctAnswerDescription: correctDescription });
      if (!output) return;
      const we: StepExplanationItem[] = output.worked_example.map((s: { text: string }) => ({
        text: s.text,
        iconId: "star" as IconId,
      }));
      setWorkedExampleSteps(we);
      if (builder.type === "order_steps") {
        setBuilder({
          type: "order_steps",
          steps: output.steps.map((s: { text: string }) => ({ text: s.text, iconId: "star" as IconId })),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi AI");
    }
  };

  const handleSave = () => {
    setError(null);
    startSaving(async () => {
      try {
        const input = {
          difficulty,
          prompt,
          formInput: builderToFormInput(builder),
          workedExampleSteps,
          explanationSteps,
        };
        if (props.mode === "create") {
          const created = await createTask(props.topicId, input);
          router.push(`/teacher/bank/${created.id}`);
        } else if (props.taskId) {
          await updateTask(props.taskId, input);
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lưu thất bại");
      }
    });
  };

  const handleApprove = () => {
    if (!props.taskId) return;
    startApproving(async () => {
      try {
        await approveTask(props.taskId!);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Duyệt thất bại");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        {error && <p className="rounded bg-coral/10 p-2 text-sm text-coral">{error}</p>}

        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
            Dạng bài
            <select
              value={type}
              disabled={props.mode === "edit"}
              onChange={(e) => {
                const t = e.target.value as TaskType;
                setType(t);
                setBuilder(defaultBuilder(t));
              }}
              className="rounded border border-border px-2 py-1.5 disabled:opacity-60"
            >
              {Object.entries(TASK_TYPE_LABELS).map(([t, label]) => (
                <option key={t} value={t}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
            Độ khó
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
              className="rounded border border-border px-2 py-1.5"
            >
              <option value={1}>1 — Dễ</option>
              <option value={2}>2 — Vừa</option>
              <option value={3}>3 — Khó</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Đề bài
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="rounded border border-border px-2 py-1.5"
            placeholder="VD: 27 cộng 6 bằng mấy?"
          />
          <button
            type="button"
            onClick={suggestSimplify}
            disabled={aiBusy !== null || !prompt}
            className="self-start text-sm text-sky-deep underline disabled:opacity-50"
          >
            {aiBusy === "simplify" ? "Đang gợi ý..." : "✦ AI: Đơn giản hoá câu"}
          </button>
        </label>

        {builder.type === "pick_image" && (
          <div className="flex flex-col gap-2 rounded border border-border p-3">
            <p className="text-sm font-medium">Các lựa chọn</p>
            {builder.options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-option"
                  checked={builder.correctOptionId === opt.id}
                  onChange={() => setBuilder({ ...builder, correctOptionId: opt.id })}
                  title="Đáp án đúng"
                />
                <select
                  value={opt.iconId}
                  onChange={(e) => {
                    const options = [...builder.options];
                    options[i] = { ...opt, iconId: e.target.value as IconId };
                    setBuilder({ ...builder, options });
                  }}
                  className="rounded border border-border px-1 py-1 text-sm"
                >
                  {ICON_IDS.map((id) => (
                    <option key={id} value={id}>
                      {ICON_LABELS_VI[id]}
                    </option>
                  ))}
                </select>
                <input
                  value={opt.label}
                  onChange={(e) => {
                    const options = [...builder.options];
                    options[i] = { ...opt, label: e.target.value };
                    setBuilder({ ...builder, options });
                  }}
                  placeholder="Nhãn (vd. 13)"
                  className="flex-1 rounded border border-border px-2 py-1 text-sm"
                />
                {opt.id !== builder.correctOptionId && (
                  <select
                    value={builder.distractorTags[opt.id] ?? ""}
                    onChange={(e) =>
                      setBuilder({
                        ...builder,
                        distractorTags: { ...builder.distractorTags, [opt.id]: e.target.value as MistakeTag },
                      })
                    }
                    className="rounded border border-border px-1 py-1 text-xs"
                  >
                    <option value="">(không dùng làm nhiễu)</option>
                    {MISTAKE_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {MISTAKE_TAG_LABELS_VI[tag]}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setBuilder({ ...builder, options: builder.options.filter((o) => o.id !== opt.id) })
                  }
                  className="text-sm text-coral"
                >
                  Xoá
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setBuilder({
                  ...builder,
                  options: [...builder.options, { id: newId("opt"), iconId: "star", label: "" }],
                })
              }
              className="self-start text-sm text-sky-deep underline"
            >
              + Thêm lựa chọn
            </button>
          </div>
        )}

        {builder.type === "number" && (
          <div className="flex flex-col gap-2 rounded border border-border p-3">
            <div className="flex gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Đáp án đúng
                <input
                  value={builder.correctValue}
                  onChange={(e) => setBuilder({ ...builder, correctValue: e.target.value })}
                  inputMode="numeric"
                  className="w-24 rounded border border-border px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Số chữ số tối đa
                <input
                  type="number"
                  value={builder.maxDigits}
                  onChange={(e) => setBuilder({ ...builder, maxDigits: Number(e.target.value) || 1 })}
                  className="w-20 rounded border border-border px-2 py-1"
                />
              </label>
            </div>
            <p className="text-sm font-medium">Đáp án nhiễu</p>
            {builder.distractors.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={d.value}
                  onChange={(e) => {
                    const distractors = [...builder.distractors];
                    distractors[i] = { ...d, value: e.target.value };
                    setBuilder({ ...builder, distractors });
                  }}
                  inputMode="numeric"
                  className="w-24 rounded border border-border px-2 py-1 text-sm"
                />
                <select
                  value={d.mistakeTag}
                  onChange={(e) => {
                    const distractors = [...builder.distractors];
                    distractors[i] = { ...d, mistakeTag: e.target.value as MistakeTag };
                    setBuilder({ ...builder, distractors });
                  }}
                  className="rounded border border-border px-1 py-1 text-xs"
                >
                  {MISTAKE_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {MISTAKE_TAG_LABELS_VI[tag]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setBuilder({ ...builder, distractors: builder.distractors.filter((_, j) => j !== i) })
                  }
                  className="text-sm text-coral"
                >
                  Xoá
                </button>
              </div>
            ))}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setBuilder({
                    ...builder,
                    distractors: [...builder.distractors, { value: "", mistakeTag: "doan_lung_tung" }],
                  })
                }
                className="self-start text-sm text-sky-deep underline"
              >
                + Thêm đáp án nhiễu
              </button>
              <button
                type="button"
                onClick={suggestDistractors}
                disabled={aiBusy !== null || !builder.correctValue}
                className="self-start text-sm text-sky-deep underline disabled:opacity-50"
              >
                {aiBusy === "distractors" ? "Đang gợi ý..." : "✦ AI: Gợi ý đáp án nhiễu"}
              </button>
            </div>
          </div>
        )}

        {builder.type === "true_false" && (
          <div className="flex gap-4 rounded border border-border p-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={builder.correctValue === true}
                onChange={() => setBuilder({ type: "true_false", correctValue: true })}
              />
              Đáp án đúng là &ldquo;Đúng&rdquo;
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={builder.correctValue === false}
                onChange={() => setBuilder({ type: "true_false", correctValue: false })}
              />
              Đáp án đúng là &ldquo;Sai&rdquo;
            </label>
          </div>
        )}

        {builder.type === "drag_drop" && (
          <div className="flex flex-col gap-3 rounded border border-border p-3">
            <div>
              <p className="text-sm font-medium">Thẻ kéo</p>
              {builder.items.map((item, i) => (
                <div key={item.id} className="mt-1 flex items-center gap-2">
                  <input
                    value={item.label}
                    onChange={(e) => {
                      const items = [...builder.items];
                      items[i] = { ...item, label: e.target.value };
                      setBuilder({ ...builder, items });
                    }}
                    className="w-32 rounded border border-border px-2 py-1 text-sm"
                    placeholder="VD: 5"
                  />
                  <select
                    value={builder.correctMapping[item.id] ?? ""}
                    onChange={(e) =>
                      setBuilder({
                        ...builder,
                        correctMapping: { ...builder.correctMapping, [item.id]: e.target.value },
                      })
                    }
                    className="rounded border border-border px-1 py-1 text-sm"
                  >
                    <option value="">— đúng vào ô —</option>
                    {builder.targets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label || "(chưa đặt tên ô)"}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setBuilder({ ...builder, items: builder.items.filter((it) => it.id !== item.id) })}
                    className="text-sm text-coral"
                  >
                    Xoá
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBuilder({ ...builder, items: [...builder.items, { id: newId("item"), label: "" }] })}
                className="mt-1 text-sm text-sky-deep underline"
              >
                + Thêm thẻ
              </button>
            </div>
            <div>
              <p className="text-sm font-medium">Ô thả</p>
              {builder.targets.map((target, i) => (
                <div key={target.id} className="mt-1 flex items-center gap-2">
                  <input
                    value={target.label}
                    onChange={(e) => {
                      const targets = [...builder.targets];
                      targets[i] = { ...target, label: e.target.value };
                      setBuilder({ ...builder, targets });
                    }}
                    className="w-40 rounded border border-border px-2 py-1 text-sm"
                    placeholder="VD: Hàng chục"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setBuilder({ ...builder, targets: builder.targets.filter((t) => t.id !== target.id) })
                    }
                    className="text-sm text-coral"
                  >
                    Xoá
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setBuilder({ ...builder, targets: [...builder.targets, { id: newId("target"), label: "" }] })
                }
                className="mt-1 text-sm text-sky-deep underline"
              >
                + Thêm ô
              </button>
            </div>
            <p className="text-xs text-ink/50">Đáp án nhiễu cho dạng kéo thả được tạo tự động (hoán vị thẻ/ô).</p>
          </div>
        )}

        {builder.type === "order_steps" && (
          <div className="rounded border border-border p-3">
            <p className="mb-1 text-xs text-ink/50">Nhập các bước theo ĐÚNG thứ tự — hệ thống tự xáo trộn cho học sinh.</p>
            <StepRowsEditor
              title="Các bước (đúng thứ tự)"
              steps={builder.steps}
              onChange={(steps) => setBuilder({ type: "order_steps", steps })}
            />
            <button
              type="button"
              onClick={suggestSteps}
              disabled={aiBusy !== null || !prompt}
              className="mt-2 text-sm text-sky-deep underline disabled:opacity-50"
            >
              {aiBusy === "steps" ? "Đang gợi ý..." : "✦ AI: Gợi ý các bước + ví dụ"}
            </button>
          </div>
        )}

        <StepRowsEditor title="Ví dụ minh hoạ (worked example)" steps={workedExampleSteps} onChange={setWorkedExampleSteps} />
        {builder.type !== "order_steps" && (
          <button
            type="button"
            onClick={suggestSteps}
            disabled={aiBusy !== null || !prompt}
            className="self-start text-sm text-sky-deep underline disabled:opacity-50"
          >
            {aiBusy === "steps" ? "Đang gợi ý..." : "✦ AI: Gợi ý ví dụ minh hoạ"}
          </button>
        )}
        <StepRowsEditor title="Giải thích ngắn" steps={explanationSteps} onChange={setExplanationSteps} />

        {warnings.length > 0 && (
          <div className="flex flex-col gap-1 rounded border border-sun bg-sun/10 p-3 text-sm">
            <p className="font-medium">Cảnh báo trước khi duyệt:</p>
            {warnings.map((w, i) => (
              <p key={i}>• {w.message}</p>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !prompt}
            className="rounded bg-sky-deep px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : props.mode === "create" ? "Lưu nháp" : "Lưu thay đổi"}
          </button>
          {props.mode === "edit" && props.initialStatus !== "approved" && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving}
              className="rounded bg-leaf px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {approving ? "Đang duyệt..." : "Duyệt"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink/60">Xem trước (như học sinh sẽ thấy)</p>
        <div className="mx-auto w-full max-w-[420px] rounded-[32px] border-8 border-ink/10 bg-paper p-4 shadow-lg">
          <TaskScreen task={previewTask} stepTotal={5} stepCurrent={1} submitting={false} onAnswer={() => {}} />
        </div>
      </div>
    </div>
  );
}
