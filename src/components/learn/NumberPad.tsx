"use client";

import { useState } from "react";
import { vi } from "@/lib/i18n/vi";
import { clsx } from "@/lib/clsx";

export interface NumberPadProps {
  maxDigits: number;
  onSubmit: (value: number) => void;
  disabled?: boolean;
}

export function NumberPad({ maxDigits, onSubmit, disabled }: NumberPadProps) {
  const [digits, setDigits] = useState("");

  const pressDigit = (d: string) => {
    if (disabled) return;
    if (digits.length >= maxDigits) return;
    setDigits((prev) => prev + d);
  };

  const clear = () => setDigits("");

  const submit = () => {
    if (digits.length === 0 || disabled) return;
    onSubmit(Number(digits));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="min-h-20 min-w-40 rounded-[20px] border-b-[6px] border-border bg-card px-6 py-3 text-center font-baloo text-4xl font-bold">
        {digits || "—"}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => pressDigit(d)}
            className="flex h-16 w-16 items-center justify-center rounded-[20px] border-b-[6px] border-sky-deep bg-sky font-baloo text-2xl font-bold text-white transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-60"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={clear}
          className="flex h-16 w-16 items-center justify-center rounded-[20px] border-b-[6px] border-[#E06B46] bg-coral font-nunito text-sm font-bold text-white transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-60"
        >
          {vi.learn.numberPadClear}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => pressDigit("0")}
          className="flex h-16 w-16 items-center justify-center rounded-[20px] border-b-[6px] border-sky-deep bg-sky font-baloo text-2xl font-bold text-white transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-60"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled || digits.length === 0}
          onClick={submit}
          className={clsx(
            "flex h-16 w-16 items-center justify-center rounded-[20px] border-b-[6px] border-[#3C9A66] bg-leaf font-nunito text-sm font-bold text-white transition-transform active:translate-y-1 active:border-b-[2px]",
            digits.length === 0 && "opacity-60",
          )}
        >
          {vi.learn.numberPadDone}
        </button>
      </div>
    </div>
  );
}
