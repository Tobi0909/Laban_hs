"use client";

import { signOut } from "next-auth/react";
import { KidButton } from "@/components/kid/KidButton";
import { vi } from "@/lib/i18n/vi";

export function SwitchFriendButton({ joinCode }: { joinCode: string }) {
  return (
    <KidButton tone="paper" onClick={() => signOut({ callbackUrl: `/c/${joinCode}` })}>
      {vi.classEntry.switchFriend}
    </KidButton>
  );
}
