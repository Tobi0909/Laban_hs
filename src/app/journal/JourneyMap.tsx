"use client";

import { useMemo, useState } from "react";
import { Kim, type KimMood } from "@/components/kid/Kim";
import { AudioButton } from "@/components/kid/AudioButton";
import { Sparkle, MagnifyingGlass } from "@/components/kid/icons";
import { vi } from "@/lib/i18n/vi";
import type { Confidence } from "@/lib/learning/grade";
import type { NextStepChoice } from "@/lib/db/schema";
import type { JourneyStone } from "./data";
import { clsx } from "@/lib/clsx";

const CONFIDENCE_MOOD: Record<Confidence, KimMood> = { 1: "help", 2: "ok", 3: "sure" };
const CONFIDENCE_LABEL: Record<Confidence, string> = {
  1: vi.confidence.needHelp,
  2: vi.confidence.thinkCan,
  3: vi.confidence.sure,
};
const NEXT_STEP_LABEL: Record<NextStepChoice, string> = {
  practice: vi.nextStep.practice,
  review_example: vi.nextStep.reviewExample,
  how_to: vi.nextStep.howTo,
  harder: vi.nextStep.harder,
};

const STONE_SPACING = 140;
const AMPLITUDE = 70;
const BASE_Y = 220;
const PADDING_X = 100;

function stonePosition(index: number) {
  const x = PADDING_X + index * STONE_SPACING;
  const y = BASE_Y + Math.sin(index * 0.9) * AMPLITUDE;
  return { x, y };
}

function PalmTree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 40 L-3 0 L3 0 Z" fill="#8A6A3D" />
      <path d="M0 2c-14-10-26-4-28 4 10-4 18-2 28-4Z" fill="#5CC98A" />
      <path d="M0 2c14-10 26-2 26 6-10-4-16-2-26-6Z" fill="#5CC98A" />
      <path d="M0 2c-4-14 4-22 10-22-2 10-4 16-10 22Z" fill="#5CC98A" />
    </g>
  );
}

export function JourneyMap({ stones }: { stones: JourneyStone[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const width = Math.max(800, PADDING_X * 2 + stones.length * STONE_SPACING);
  const positions = useMemo(() => stones.map((_, i) => stonePosition(i)), [stones]);
  const pathD = useMemo(
    () => positions.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "),
    [positions],
  );

  if (stones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Kim mood="sleep" size="lg" />
        <p className="font-nunito text-xl">{vi.journey.empty}</p>
      </div>
    );
  }

  const selected = openIndex !== null ? stones[openIndex] : null;
  const selectedText = selected
    ? `${vi.journey.guessPrefix} ${CONFIDENCE_LABEL[selected.confidence]}. ${vi.journey.resultPrefix} ${
        selected.isCorrect ? vi.journey.resultCorrect : vi.journey.resultWrong
      }.${
        selected.chosenNextStep
          ? ` ${vi.journey.choicePrefix} ${NEXT_STEP_LABEL[selected.chosenNextStep]}.`
          : ""
      }`
    : "";

  return (
    <div className="w-full">
      <div className="relative w-full overflow-x-auto overscroll-x-contain rounded-[24px] border border-border" style={{ scrollSnapType: "x proximity" }}>
        <div className="relative" style={{ width, height: 400 }}>
          <svg width={width} height={400} viewBox={`0 0 ${width} 400`} className="absolute inset-0">
            <defs>
              <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4FB3E8" />
                <stop offset="100%" stopColor="#7FC9EE" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={width} height="110" fill="url(#sea)" />
            <path
              d={`M0 110 Q ${width / 2} 70 ${width} 110 L ${width} 400 L 0 400 Z`}
              fill="#F3E3C0"
            />
            <path d={pathD} fill="none" stroke="#E9DCC6" strokeWidth={10} strokeLinecap="round" strokeDasharray="2 22" />
            {positions
              .filter((_, i) => i % 4 === 0)
              .map((p, i) => (
                <PalmTree key={i} x={p.x - 50} y={p.y + 60} />
              ))}
          </svg>

          {stones.map((stone, i) => {
            const pos = positions[i];
            const isLast = i === stones.length - 1;
            return (
              <div
                key={stone.attemptId}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: pos.x, top: pos.y, scrollSnapAlign: "center" }}
              >
                {isLast && (
                  <div className="absolute -left-16 -top-6">
                    <Kim mood="wave" size="sm" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  aria-label={`Viên đá ${i + 1}`}
                  className={clsx(
                    "relative flex h-16 w-16 items-center justify-center rounded-full border-4 bg-card shadow-md transition-transform active:scale-95",
                    isLast ? "border-sun" : "border-border",
                  )}
                >
                  <div className="h-10 w-10">
                    <Kim mood={CONFIDENCE_MOOD[stone.confidence]} size="sm" />
                  </div>
                  <span className="absolute -right-1 -top-1 h-5 w-5">
                    {stone.isCorrect ? <Sparkle /> : <MagnifyingGlass />}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 sm:items-center" onClick={() => setOpenIndex(null)}>
          <div
            className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[24px] border border-border bg-card p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Kim mood={selected.isCorrect ? "cheer" : "look"} size="md" />
            <p className="font-nunito text-lg">
              {vi.journey.guessPrefix} <strong>{CONFIDENCE_LABEL[selected.confidence]}</strong>
            </p>
            <p className="font-nunito text-lg">
              {vi.journey.resultPrefix}{" "}
              <strong>{selected.isCorrect ? vi.journey.resultCorrect : vi.journey.resultWrong}</strong>
            </p>
            {selected.chosenNextStep && (
              <p className="font-nunito text-lg">
                {vi.journey.choicePrefix} <strong>{NEXT_STEP_LABEL[selected.chosenNextStep]}</strong>
              </p>
            )}
            <AudioButton text={selectedText} />
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              {vi.journey.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
