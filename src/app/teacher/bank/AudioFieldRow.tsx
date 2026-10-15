"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface AudioFieldRowProps {
  kind: "task" | "reflection";
  id: string;
  fieldKey: string;
  text: string;
  audioUrl?: string | null;
}

export function AudioFieldRow({ kind, id, fieldKey, text, audioUrl }: AudioFieldRowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const regenerate = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/author/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, key: fieldKey }),
      });
      if (!res.ok) {
        setError("Tạo audio thất bại.");
        return;
      }
      router.refresh();
    });
  };

  const uploadReplacement = (file: File) => {
    setError(null);
    startTransition(async () => {
      const form = new FormData();
      form.set("kind", kind);
      form.set("id", id);
      form.set("key", fieldKey);
      form.set("file", file);
      const res = await fetch("/api/author/tts/upload", { method: "POST", body: form });
      if (!res.ok) {
        setError("Tải file lên thất bại.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 border-b border-border/50 py-1.5 text-sm">
      <span className="flex-1 truncate" title={text}>
        {text}
      </span>
      {audioUrl ? (
        <audio controls src={audioUrl} className="h-8 w-40" />
      ) : (
        <span className="text-xs text-ink/40">Chưa có audio</span>
      )}
      <button type="button" onClick={regenerate} disabled={pending} className="text-xs text-sky-deep underline disabled:opacity-50">
        {pending ? "..." : "Tạo lại"}
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={pending}
        className="text-xs text-sky-deep underline disabled:opacity-50"
      >
        Tải file lên
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadReplacement(file);
          e.target.value = "";
        }}
      />
      {error && <span className="text-xs text-coral">{error}</span>}
    </div>
  );
}
