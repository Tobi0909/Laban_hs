"use client";

import { Kim } from "@/components/kid/Kim";
import { AudioButton } from "@/components/kid/AudioButton";
import { ProgressStones } from "@/components/kid/ProgressStones";
import { CardChoice } from "@/components/learn/CardChoice";
import { DragBoard } from "@/components/learn/DragBoard";
import { NumberPad } from "@/components/learn/NumberPad";
import { TrueFalseChoice } from "@/components/learn/TrueFalseChoice";
import { StepCards } from "@/components/learn/StepCards";
import type { AnswerValue } from "@/lib/learning/types";
import type { PublicTask } from "@/lib/learning/public-task";
import { vi } from "@/lib/i18n/vi";

export function TaskScreen({
  task,
  stepTotal,
  stepCurrent,
  submitting,
  onAnswer,
}: {
  task: PublicTask;
  stepTotal: number;
  stepCurrent: number;
  submitting: boolean;
  onAnswer: (answer: AnswerValue) => void;
}) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6">
      <ProgressStones total={stepTotal} current={stepCurrent} />
      <Kim mood={submitting ? "think" : "look"} size="md" />
      <div className="flex items-center gap-2 text-center">
        <p className="font-baloo text-2xl font-semibold">{task.prompt}</p>
        <AudioButton text={task.prompt} audioUrl={task.promptAudioUrl} />
      </div>

      {submitting && <p className="font-nunito text-lg text-ink/60">{vi.learn.grading}</p>}

      {!submitting && task.content.type === "pick_image" && (
        <CardChoice options={task.content.options} onSelect={(optionId) => onAnswer({ type: "pick_image", optionId })} />
      )}

      {!submitting && task.content.type === "number" && (
        <NumberPad
          maxDigits={task.content.maxDigits}
          onSubmit={(value) => onAnswer({ type: "number", value })}
        />
      )}

      {!submitting && task.content.type === "true_false" && (
        <TrueFalseChoice onSelect={(value) => onAnswer({ type: "true_false", value })} />
      )}

      {!submitting && task.content.type === "order_steps" && (
        <StepCards steps={task.content.steps} onSubmit={(order) => onAnswer({ type: "order_steps", order })} />
      )}

      {!submitting && task.content.type === "drag_drop" && (
        <DragBoard
          items={task.content.items}
          targets={task.content.targets}
          onSubmit={(mapping) => onAnswer({ type: "drag_drop", mapping })}
        />
      )}
    </div>
  );
}
