"use client";

import { useState } from "react";
import { Kim } from "@/components/kid/Kim";
import { Card } from "@/components/kid/Card";
import { AudioButton } from "@/components/kid/AudioButton";
import { RefreshLoop, OpenBook, LightBulb, Mountain, ICONS } from "@/components/kid/icons";
import type { NextStepChoice } from "@/lib/db/schema";
import type { Explanation, WorkedExample } from "@/lib/learning/types";
import { vi } from "@/lib/i18n/vi";
import { clsx } from "@/lib/clsx";

const BUTTONS: { value: NextStepChoice; label: string; icon: typeof RefreshLoop }[] = [
  { value: "practice", label: vi.nextStep.practice, icon: RefreshLoop },
  { value: "review_example", label: vi.nextStep.reviewExample, icon: OpenBook },
  { value: "how_to", label: vi.nextStep.howTo, icon: LightBulb },
  { value: "harder", label: vi.nextStep.harder, icon: Mountain },
];

export function NextStepScreen({
  suggested,
  reasonText,
  workedExample,
  explanation,
  onChoose,
}: {
  suggested: NextStepChoice;
  reasonText: string;
  workedExample: WorkedExample;
  explanation: Explanation;
  onChoose: (chosen: NextStepChoice) => void;
}) {
  const [expanded, setExpanded] = useState<"review_example" | "how_to" | null>(null);

  if (expanded) {
    const steps = expanded === "review_example" ? workedExample.steps : explanation.steps;
    return (
      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <Kim mood="look" size="md" />
        <p className="font-baloo text-2xl font-semibold text-sky-deep">
          {expanded === "review_example" ? vi.learn.viewExample : vi.learn.viewHowTo}
        </p>
        <Card className="flex w-full flex-col gap-3">
          {steps.map((step, i) => {
            const Icon = ICONS[step.iconId];
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0">
                  <Icon />
                </div>
                <p className="flex-1 font-nunito text-lg">{step.text}</p>
                <AudioButton text={step.text} size="sm" />
              </div>
            );
          })}
        </Card>
        <button
          type="button"
          onClick={() => onChoose(expanded)}
          className="rounded-lg bg-sky-deep px-6 py-3 font-medium text-white"
        >
          {vi.learn.continueLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <Kim mood="ok" size="md" />
      <div className="flex items-center gap-2">
        <p className="font-nunito text-xl">{reasonText}</p>
        <AudioButton text={reasonText} size="sm" />
      </div>
      <div className="grid w-full grid-cols-2 gap-4">
        {BUTTONS.map((b) => {
          const Icon = b.icon;
          const isSuggested = b.value === suggested;
          return (
            <button
              key={b.value}
              type="button"
              onClick={() => {
                if (b.value === "review_example" || b.value === "how_to") {
                  setExpanded(b.value);
                } else {
                  onChoose(b.value);
                }
              }}
              className={clsx(
                "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-[24px] border-b-[6px] border-border bg-card p-4 transition-transform active:translate-y-1 active:border-b-[2px]",
                isSuggested && "ring-4 ring-sun border-sun",
              )}
            >
              {isSuggested && (
                <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-semibold text-ink">
                  {vi.learn.suggestedBadge}
                </span>
              )}
              <div className="h-16 w-16">
                <Icon />
              </div>
              <span className="font-baloo text-lg font-semibold">{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
