"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Kim } from "@/components/kid/Kim";
import { Card } from "@/components/kid/Card";
import { vi } from "@/lib/i18n/vi";

export function QrAutoLogin({ ticket }: { ticket: string }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    signIn("student", { ticket, redirect: false }).then((result) => {
      if (cancelled) return;
      if (result?.ok) {
        router.push("/s");
        router.refresh();
      } else {
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ticket, router]);

  return (
    <Card className="flex max-w-md flex-col items-center gap-4 text-center">
      <Kim mood={failed ? "help" : "cheer"} size="lg" />
      <p className="font-nunito text-xl">{failed ? vi.classEntry.wrong : vi.classEntry.entering}</p>
    </Card>
  );
}
