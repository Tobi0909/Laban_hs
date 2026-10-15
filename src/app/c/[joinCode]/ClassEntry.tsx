"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Kim } from "@/components/kid/Kim";
import { KidButton } from "@/components/kid/KidButton";
import { Card } from "@/components/kid/Card";
import { AVATARS, ICON_IDS, ICONS, ICON_LABELS_VI, type IconId } from "@/components/kid/icons";
import { vi } from "@/lib/i18n/vi";
import { attemptPictureLogin, type ClassEntryData } from "./actions";

type Step = "avatar" | "pictures" | "entering";

export function ClassEntry({
  joinCode,
  initialData,
}: {
  joinCode: string;
  initialData: ClassEntryData;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("avatar");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [picks, setPicks] = useState<IconId[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!initialData.sessionOpen) {
    return (
      <Card className="flex max-w-md flex-col items-center gap-4 text-center">
        <Kim mood="sleep" size="lg" />
        <p className="font-baloo text-2xl font-semibold text-sky-deep">{initialData.className}</p>
        <p className="font-nunito text-xl">{vi.classEntry.sessionClosed}</p>
      </Card>
    );
  }

  const resetToAvatar = () => {
    setStep("avatar");
    setStudentId(null);
    setPicks([]);
    setMessage(null);
  };

  const pickImage = async (iconId: IconId) => {
    if (busy || !studentId) return;
    const nextPicks = [...picks, iconId];
    setPicks(nextPicks);
    if (nextPicks.length < 2) return;

    setBusy(true);
    setMessage(null);
    const result = await attemptPictureLogin(joinCode, studentId, nextPicks);
    if (!result.ok) {
      setMessage(result.reason === "locked" ? vi.classEntry.locked : result.reason === "session_closed" ? vi.classEntry.sessionClosed : vi.classEntry.wrong);
      setPicks([]);
      setBusy(false);
      return;
    }

    setStep("entering");
    const signInResult = await signIn("student", { ticket: result.ticket, redirect: false });
    if (signInResult?.ok) {
      router.push("/s");
      router.refresh();
    } else {
      setMessage(vi.classEntry.wrong);
      setStep("pictures");
      setPicks([]);
      setBusy(false);
    }
  };

  if (step === "entering") {
    return (
      <Card className="flex max-w-md flex-col items-center gap-4 text-center">
        <Kim mood="cheer" size="lg" />
        <p className="font-baloo text-2xl font-semibold text-sky-deep">{vi.classEntry.entering}</p>
      </Card>
    );
  }

  if (step === "pictures" && studentId) {
    return (
      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <Kim mood={message ? "look" : "think"} size="md" />
        <p className="font-baloo text-2xl font-semibold text-center">{vi.classEntry.choosePictures}</p>
        {message && <p className="font-nunito text-lg text-lavender">{message}</p>}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {ICON_IDS.map((id) => {
            const Icon = ICONS[id];
            return (
              <button
                key={id}
                type="button"
                disabled={busy}
                onClick={() => pickImage(id)}
                aria-label={ICON_LABELS_VI[id]}
                className="flex h-20 w-20 items-center justify-center rounded-[20px] border-b-[6px] border-border bg-card p-3 transition-transform active:translate-y-1 active:border-b-[2px] disabled:opacity-50"
              >
                <Icon />
              </button>
            );
          })}
        </div>
        <KidButton tone="paper" onClick={resetToAvatar}>
          {vi.classEntry.switchFriend}
        </KidButton>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      <Kim mood="wave" size="md" />
      <p className="font-baloo text-3xl font-semibold text-sky-deep">{initialData.className}</p>
      <p className="font-baloo text-2xl font-semibold text-center">{vi.classEntry.chooseYou}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {initialData.students.map((s) => {
          const Avatar = AVATARS[s.avatarId as keyof typeof AVATARS];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setStudentId(s.id);
                setStep("pictures");
              }}
              className="flex min-h-[140px] min-w-[140px] flex-col items-center justify-center gap-2 rounded-[24px] border-b-[6px] border-border bg-card p-4 transition-transform active:translate-y-1 active:border-b-[2px]"
            >
              <div className="h-16 w-16">{Avatar ? <Avatar /> : null}</div>
              <span className="font-baloo text-lg font-semibold">{s.displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
