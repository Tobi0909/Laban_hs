"use client";

import { useEffect, useState } from "react";
import { Kim } from "@/components/kid/Kim";
import { Card } from "@/components/kid/Card";
import type { Confidence } from "@/lib/learning/grade";
import type { AnswerValue } from "@/lib/learning/types";
import type { PublicTask } from "@/lib/learning/public-task";
import { vi } from "@/lib/i18n/vi";
import { ConfidenceScreen } from "./ConfidenceScreen";
import { TaskScreen } from "./TaskScreen";
import { ReflectionScreen } from "./ReflectionScreen";
import { NextStepScreen } from "./NextStepScreen";
import { CelebrationScreen } from "./CelebrationScreen";
import { startAttempt, submitAnswer, submitReflection, chooseNextStep, endSession, type SubmitAnswerResult } from "./actions";

const MAX_TASKS = 5;
const MAX_SESSION_MS = 15 * 60 * 1000;

type Phase = "confidence" | "task" | "reflection" | "nextstep";
type Status = "loading" | "closed" | "ready" | "finished";

interface SessionPackResponse {
  topicId: string;
  topicTitle: string;
  tasks: PublicTask[];
}

export function LearnFlow({ topicId }: { topicId: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(0);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("confidence");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [reasonCard, setReasonCard] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingReflection, setSubmittingReflection] = useState(false);
  const [result, setResult] = useState<SubmitAnswerResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [packRes, attemptRes] = await Promise.all([
        fetch(`/api/session-pack/${topicId}`).then((r) => r.json() as Promise<SessionPackResponse>),
        startAttempt(topicId),
      ]);
      if (cancelled) return;
      if ("error" in attemptRes) {
        setStatus("closed");
        return;
      }
      setTasks(packRes.tasks.slice(0, MAX_TASKS));
      setSessionId(attemptRes.sessionId);
      setSessionStartedAt(Date.now());
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const currentTask = tasks[index];
  const totalSteps = Math.min(MAX_TASKS, tasks.length);

  const handleConfidenceSubmit = (c: Confidence, reason: string | null) => {
    setConfidence(c);
    setReasonCard(reason);
    setPhase("task");
  };

  const handleAnswer = async (answer: AnswerValue) => {
    if (!sessionId || !currentTask || confidence === null) return;
    setSubmitting(true);
    const clientId = crypto.randomUUID();
    const res = await submitAnswer({
      sessionId,
      taskId: currentTask.id,
      confidence,
      reasonCard,
      answer,
      clientId,
    });
    setResult(res);
    setSubmitting(false);
    setPhase("reflection");
  };

  const handleReflectionChoice = async (choiceId: string) => {
    if (!result?.reflectionTemplate) return;
    setSubmittingReflection(true);
    await submitReflection(result.attemptId, result.reflectionTemplate.id, choiceId);
    setSubmittingReflection(false);
    setPhase("nextstep");
  };

  const skipReflection = () => setPhase("nextstep");

  const advance = async () => {
    const isLast = index + 1 >= totalSteps;
    const timedOut = Date.now() - sessionStartedAt > MAX_SESSION_MS;
    if (isLast || timedOut) {
      if (sessionId) await endSession(sessionId);
      setStatus("finished");
      return;
    }
    setIndex((i) => i + 1);
    setConfidence(null);
    setReasonCard(null);
    setResult(null);
    setPhase("confidence");
  };

  const handleNextStepChoice = async (chosen: Parameters<typeof chooseNextStep>[2]) => {
    if (!result) return;
    await chooseNextStep(result.attemptId, result.nextStepSuggestion.suggested, chosen);
    await advance();
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4">
        <Kim mood="think" size="lg" />
        <p className="font-nunito text-lg text-ink/60">Đang tải bài học...</p>
      </div>
    );
  }

  if (status === "closed") {
    return (
      <Card className="flex max-w-md flex-col items-center gap-4 text-center">
        <Kim mood="sleep" size="lg" />
        <p className="font-nunito text-xl">{vi.classEntry.sessionClosed}</p>
      </Card>
    );
  }

  if (status === "finished") {
    return <CelebrationScreen />;
  }

  if (!currentTask) {
    return (
      <Card className="flex max-w-md flex-col items-center gap-4 text-center">
        <Kim mood="help" size="lg" />
        <p className="font-nunito text-xl">Chủ đề này chưa có bài tập nào.</p>
      </Card>
    );
  }

  if (phase === "confidence") {
    return (
      <ConfidenceScreen
        prompt={currentTask.prompt}
        promptAudioUrl={currentTask.promptAudioUrl}
        onSubmit={handleConfidenceSubmit}
      />
    );
  }

  if (phase === "task") {
    return (
      <TaskScreen
        task={currentTask}
        stepTotal={totalSteps}
        stepCurrent={index}
        submitting={submitting}
        onAnswer={handleAnswer}
      />
    );
  }

  if (phase === "reflection" && result && confidence !== null) {
    return (
      <>
        <ReflectionScreen
          confidence={confidence}
          isCorrect={result.isCorrect}
          reflectionTemplate={result.reflectionTemplate}
          submittingReflection={submittingReflection}
          onChoose={handleReflectionChoice}
        />
        {!result.reflectionTemplate && (
          <button type="button" onClick={skipReflection} className="mt-4 text-sm text-ink/50 underline">
            {vi.reasonCards.skip}
          </button>
        )}
      </>
    );
  }

  if (phase === "nextstep" && result) {
    return (
      <NextStepScreen
        suggested={result.nextStepSuggestion.suggested}
        reasonText={result.nextStepSuggestion.reasonText}
        workedExample={result.workedExample}
        explanation={result.explanation}
        onChoose={handleNextStepChoice}
      />
    );
  }

  return null;
}
