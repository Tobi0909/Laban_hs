"use client";

import { useState } from "react";
import { Kim, type KimMood } from "@/components/kid/Kim";
import { Card } from "@/components/kid/Card";
import { AudioButton } from "@/components/kid/AudioButton";
import type { Confidence } from "@/lib/learning/grade";
import { vi } from "@/lib/i18n/vi";
import { clsx } from "@/lib/clsx";

const CONFIDENCE_CARDS: { value: Confidence; label: string; mood: KimMood; tone: string }[] = [
  { value: 1, label: vi.confidence.needHelp, mood: "help", tone: "bg-sky/20 border-sky-deep" },
  { value: 2, label: vi.confidence.thinkCan, mood: "ok", tone: "bg-sun/20 border-[#D9A419]" },
  { value: 3, label: vi.confidence.sure, mood: "sure", tone: "bg-leaf/20 border-[#3C9A66]" },
];

const REASON_CARDS: { id: string; label: string }[] = [
  { id: "learnedThis", label: vi.reasonCards.learnedThis },
  { id: "likeBefore", label: vi.reasonCards.likeBefore },
  { id: "dontUnderstand", label: vi.reasonCards.dontUnderstand },
  { id: "justGuess", label: vi.reasonCards.justGuess },
];

export function ConfidenceScreen({
  prompt,
  promptAudioUrl,
  onSubmit,
}: {
  prompt: string;
  promptAudioUrl?: string | null;
  onSubmit: (confidence: Confidence, reasonCard: string | null) => void;
}) {
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  const pickConfidence = (value: Confidence) => {
    setConfidence(value);
    setShowThanks(true);
  };

  if (showThanks && confidence) {
    return (
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <Kim mood={CONFIDENCE_CARDS[confidence - 1].mood} size="lg" />
        <p className="font-baloo text-2xl font-semibold text-sky-deep">{vi.confidence.thanks}</p>
        <Card className="flex w-full flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="font-nunito text-xl">{vi.reasonCards.prompt}</p>
            <AudioButton text={vi.reasonCards.prompt} size="sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {REASON_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSubmit(confidence, card.id)}
                className="rounded-[20px] border-b-[6px] border-border bg-paper px-4 py-3 font-nunito text-base transition-transform active:translate-y-1 active:border-b-[2px]"
              >
                {card.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onSubmit(confidence, null)}
            className="font-nunito text-sm text-ink/50 underline"
          >
            {vi.reasonCards.skip}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <Kim mood="think" size="lg" />
      <div className="flex items-center gap-2">
        <p className="font-baloo text-2xl font-semibold">{prompt}</p>
        <AudioButton text={prompt} audioUrl={promptAudioUrl} />
      </div>
      <div className="flex items-center gap-2">
        <p className="font-nunito text-xl">{vi.confidence.question}</p>
        <AudioButton text={vi.confidence.question} size="sm" />
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {CONFIDENCE_CARDS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => pickConfidence(c.value)}
            className={clsx(
              "flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-[24px] border-b-[6px] p-4 transition-transform active:translate-y-1 active:border-b-[2px]",
              c.tone,
            )}
          >
            <Kim mood={c.mood} size="md" />
            <span className="font-baloo text-lg font-semibold">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
