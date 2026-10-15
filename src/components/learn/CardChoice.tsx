"use client";

import { ICONS } from "@/components/kid/icons";
import type { PickImageOption } from "@/lib/learning/types";
import { clsx } from "@/lib/clsx";

export interface CardChoiceProps {
  options: PickImageOption[];
  selectedId?: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export function CardChoice({ options, selectedId, onSelect, disabled }: CardChoiceProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {options.map((opt) => {
        const Icon = ICONS[opt.iconId];
        const selected = selectedId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(opt.id)}
            className={clsx(
              "flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-[24px] border-b-[6px] bg-card p-4 transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-60",
              selected ? "border-sun ring-4 ring-sun" : "border-border",
            )}
          >
            <div className="h-10 w-10">
              <Icon />
            </div>
            <span className="font-baloo text-2xl font-bold">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
