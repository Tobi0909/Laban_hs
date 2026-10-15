"use client";

import { clsx } from "@/lib/clsx";

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        fill="currentColor"
      />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export interface AudioButtonProps {
  text: string;
  audioUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}

/**
 * Nút loa tròn: phát file audio đã thu (audioUrl) nếu có, nếu không thì đọc
 * bằng Web Speech API (giọng tiếng Việt).
 */
export function AudioButton({ text, audioUrl, size = "md", className, label }: AudioButtonProps) {
  const play = () => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => {});
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const dim = size === "sm" ? "h-9 w-9" : "h-12 w-12";

  return (
    <button
      type="button"
      onClick={play}
      aria-label={label ?? `Nghe: ${text}`}
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full border-b-4 border-sky-deep bg-sky text-white shadow-sm transition-transform active:translate-y-0.5 active:border-b-2",
        dim,
        className,
      )}
    >
      <SpeakerIcon className={size === "sm" ? "h-4 w-4" : "h-6 w-6"} />
    </button>
  );
}
