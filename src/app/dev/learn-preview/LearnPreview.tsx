"use client";

import { useState } from "react";
import { ConfidenceScreen } from "@/app/learn/[topicId]/ConfidenceScreen";
import { TaskScreen } from "@/app/learn/[topicId]/TaskScreen";
import { ReflectionScreen } from "@/app/learn/[topicId]/ReflectionScreen";
import { NextStepScreen } from "@/app/learn/[topicId]/NextStepScreen";
import { CelebrationScreen } from "@/app/learn/[topicId]/CelebrationScreen";
import type { PublicTask } from "@/lib/learning/public-task";

const SCREENS = ["confidence", "task", "reflection", "nextstep", "celebration"] as const;
type Screen = (typeof SCREENS)[number];

const SCREEN_LABELS: Record<Screen, string> = {
  confidence: "Màn 1 — La bàn trước khi học",
  task: "Màn 2 — Nhiệm vụ",
  reflection: "Màn 3 — Gương phản tư",
  nextstep: "Màn 4 — Chọn đường học",
  celebration: "Màn chúc mừng",
};

const SAMPLE_TASK: PublicTask = {
  id: "preview-task",
  type: "drag_drop",
  difficulty: 2,
  prompt: "Kéo thẻ số vào đúng hàng Chục và hàng Đơn vị của số 58",
  promptAudioUrl: null,
  content: {
    type: "drag_drop",
    items: [
      { id: "chip5", label: "5" },
      { id: "chip8", label: "8" },
    ],
    targets: [
      { id: "box_chuc", label: "Hàng chục" },
      { id: "box_donvi", label: "Hàng đơn vị" },
    ],
  },
};

export function LearnPreview() {
  const [screen, setScreen] = useState<Screen>("confidence");

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <nav className="flex flex-wrap justify-center gap-2 print:hidden">
        {SCREENS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScreen(s)}
            className={`rounded-lg border border-border px-3 py-1.5 text-sm font-medium ${
              screen === s ? "bg-sky-deep text-white" : "bg-card"
            }`}
          >
            {SCREEN_LABELS[s]}
          </button>
        ))}
      </nav>

      {screen === "confidence" && (
        <ConfidenceScreen prompt="27 cộng 6 bằng mấy?" onSubmit={() => {}} />
      )}

      {screen === "task" && (
        <TaskScreen task={SAMPLE_TASK} stepTotal={5} stepCurrent={1} submitting={false} onAnswer={() => {}} />
      )}

      {screen === "reflection" && (
        <ReflectionScreen
          confidence={2}
          isCorrect={true}
          reflectionTemplate={{
            id: "t1",
            calibration: "match",
            mistakeTag: null,
            question: "Em đoán rất đúng về bản thân! Điều gì giúp em biết vậy?",
            questionAudioUrl: null,
            choices: [
              { id: "c1", label: "Em đã luyện nhiều rồi" },
              { id: "c2", label: "Em nhớ cách làm" },
              { id: "c3", label: "Em thấy bài giống bài cũ" },
            ],
          }}
          submittingReflection={false}
          onChoose={() => {}}
        />
      )}

      {screen === "nextstep" && (
        <NextStepScreen
          suggested="harder"
          reasonText="Em làm tốt lắm, thử bài khó hơn xem sao!"
          workedExample={{ steps: [{ text: "7 cộng 6 bằng 13, viết 3 nhớ 1 chục", iconId: "drop" }] }}
          explanation={{ steps: [{ text: "Nhớ 1 sang hàng chục", iconId: "star" }] }}
          onChoose={() => {}}
        />
      )}

      {screen === "celebration" && <CelebrationScreen />}
    </div>
  );
}
