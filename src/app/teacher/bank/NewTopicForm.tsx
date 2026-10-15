"use client";

import { useState, useTransition } from "react";
import { createTopic } from "./actions";

export function NewTopicForm({ classes }: { classes: { id: string; name: string }[] }) {
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title || !classId) return;
        startTransition(async () => {
          await createTopic(classId, title);
          setTitle("");
        });
      }}
      className="flex items-end gap-3 rounded-xl border border-border bg-card p-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        Lớp
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded border border-border px-2 py-1.5">
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Tên chủ đề mới
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border border-border px-2 py-1.5"
          placeholder="VD: Phép trừ có nhớ trong phạm vi 100"
        />
      </label>
      <button type="submit" disabled={pending} className="rounded bg-sky-deep px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? "Đang tạo..." : "Tạo chủ đề"}
      </button>
    </form>
  );
}
