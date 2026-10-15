"use client";

import { useState } from "react";
import { ICONS } from "@/components/kid/icons";
import type { StepCard } from "@/lib/learning/types";
import { AudioButton } from "@/components/kid/AudioButton";
import { vi } from "@/lib/i18n/vi";
import { clsx } from "@/lib/clsx";

export interface StepCardsProps {
  steps: StepCard[];
  onSubmit: (order: string[]) => void;
  disabled?: boolean;
}

/** Sắp xếp bước: chạm theo đúng thứ tự em nghĩ (không cần kéo thả). */
export function StepCards({ steps, onSubmit, disabled }: StepCardsProps) {
  const [order, setOrder] = useState<string[]>([]);

  const toggle = (id: string) => {
    if (disabled) return;
    setOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const reset = () => setOrder([]);

  const allSelected = order.length === steps.length;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-center font-nunito text-lg text-ink/70">{vi.learn.orderHint}</p>
      <div className="flex flex-col gap-3">
        {steps.map((step) => {
          const Icon = ICONS[step.iconId];
          const position = order.indexOf(step.id);
          const picked = position !== -1;
          return (
            <div key={step.id} className="relative">
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(step.id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-[20px] border-b-[6px] bg-card py-3 pl-3 pr-12 text-left transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-60",
                  picked ? "border-sun ring-4 ring-sun" : "border-border",
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-baloo font-bold",
                    picked ? "bg-sun text-ink" : "bg-border text-ink/50",
                  )}
                >
                  {picked ? position + 1 : "?"}
                </span>
                <div className="h-8 w-8 shrink-0">
                  <Icon />
                </div>
                <span className="font-nunito text-lg">{step.text}</span>
              </button>
              <AudioButton
                text={step.text}
                audioUrl={step.audioUrl}
                size="sm"
                className="absolute -right-2 -top-2"
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          disabled={disabled || order.length === 0}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Làm lại
        </button>
        <button
          type="button"
          onClick={() => onSubmit(order)}
          disabled={disabled || !allSelected}
          className="rounded-lg bg-sky-deep px-5 py-2 font-medium text-white disabled:opacity-50"
        >
          {vi.learn.submit}
        </button>
      </div>
    </div>
  );
}
