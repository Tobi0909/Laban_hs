"use client";

import { Kim, type KimMood } from "@/components/kid/Kim";
import { Card } from "@/components/kid/Card";
import { AudioButton } from "@/components/kid/AudioButton";
import { MagnifyingGlass, Sparkle } from "@/components/kid/icons";
import type { Confidence } from "@/lib/learning/grade";
import type { ReflectionTemplateRow } from "@/lib/learning/pick-reflection";
import { vi } from "@/lib/i18n/vi";

const CONFIDENCE_MOOD: Record<Confidence, KimMood> = { 1: "help", 2: "ok", 3: "sure" };
const CONFIDENCE_LABEL: Record<Confidence, string> = {
  1: vi.confidence.needHelp,
  2: vi.confidence.thinkCan,
  3: vi.confidence.sure,
};

export function ReflectionScreen({
  confidence,
  isCorrect,
  reflectionTemplate,
  submittingReflection,
  onChoose,
}: {
  confidence: Confidence;
  isCorrect: boolean;
  reflectionTemplate: ReflectionTemplateRow | null;
  submittingReflection: boolean;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      <Kim mood={isCorrect ? "cheer" : "look"} size="lg" />
      <p className="text-center font-baloo text-2xl font-semibold text-sky-deep">
        {isCorrect ? vi.learn.correct : vi.learn.notYetCorrect}
      </p>

      <div className="flex items-center gap-4">
        <Card className="flex flex-col items-center gap-2 px-6 py-4">
          <span className="font-nunito text-sm text-ink/60">{vi.reflection.guessLabel}</span>
          <Kim mood={CONFIDENCE_MOOD[confidence]} size="sm" />
          <span className="font-nunito text-sm">{CONFIDENCE_LABEL[confidence]}</span>
        </Card>
        <span className="font-baloo text-3xl text-ink/40">→</span>
        <Card className="flex flex-col items-center gap-2 px-6 py-4">
          <span className="font-nunito text-sm text-ink/60">{vi.reflection.resultLabel}</span>
          <div className="h-10 w-10">{isCorrect ? <Sparkle /> : <MagnifyingGlass />}</div>
          <span className="font-nunito text-sm">{isCorrect ? "Đúng" : vi.reflection.tryAgainHint}</span>
        </Card>
      </div>

      {reflectionTemplate && (
        <Card className="flex w-full flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-center">
            <p className="font-nunito text-xl">{reflectionTemplate.question}</p>
            <AudioButton text={reflectionTemplate.question} audioUrl={reflectionTemplate.questionAudioUrl} size="sm" />
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {reflectionTemplate.choices.map((choice) => (
              <div key={choice.id} className="relative">
                <button
                  type="button"
                  disabled={submittingReflection}
                  onClick={() => onChoose(choice.id)}
                  className="w-full rounded-[20px] border-b-[6px] border-border bg-paper py-3 pl-4 pr-10 text-left font-nunito text-base transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-60"
                >
                  {choice.label}
                </button>
                <AudioButton
                  text={choice.label}
                  audioUrl={choice.audioUrl}
                  size="sm"
                  className="absolute -right-2 -top-2"
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
