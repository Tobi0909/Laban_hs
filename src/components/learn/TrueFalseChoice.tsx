"use client";

import { vi } from "@/lib/i18n/vi";
import { clsx } from "@/lib/clsx";
import { AudioButton } from "@/components/kid/AudioButton";

export interface TrueFalseChoiceProps {
  selected?: boolean | null;
  onSelect: (value: boolean) => void;
  disabled?: boolean;
}

export function TrueFalseChoice({ selected, onSelect, disabled }: TrueFalseChoiceProps) {
  return (
    <div className="flex gap-6">
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(true)}
          className={clsx(
            "flex min-h-24 min-w-32 items-center justify-center rounded-[24px] border-b-[6px] bg-leaf font-baloo text-2xl font-bold text-white transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-60",
            selected === true ? "border-sun ring-4 ring-sun" : "border-[#3C9A66]",
          )}
        >
          {vi.learn.trueLabel}
        </button>
        <AudioButton text={vi.learn.trueLabel} size="sm" className="absolute -right-2 -top-2" />
      </div>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(false)}
          className={clsx(
            "flex min-h-24 min-w-32 items-center justify-center rounded-[24px] border-b-[6px] bg-coral font-baloo text-2xl font-bold text-white transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-60",
            selected === false ? "border-sun ring-4 ring-sun" : "border-[#E06B46]",
          )}
        >
          {vi.learn.falseLabel}
        </button>
        <AudioButton text={vi.learn.falseLabel} size="sm" className="absolute -right-2 -top-2" />
      </div>
    </div>
  );
}
