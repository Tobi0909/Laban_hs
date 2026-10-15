"use client";

import { useEffect, useState } from "react";
import { Cloud } from "@/components/kid/icons";
import { countPendingAttempts } from "@/lib/offline/queue";
import { trySyncQueue } from "@/lib/offline/sync-manager";
import { vi } from "@/lib/i18n/vi";

/**
 * Hình đám mây nhỏ góc màn hình khi còn bài chưa gửi được lên server —
 * không chữ "lỗi", không dấu chấm than, để không làm trẻ hoảng.
 */
export function OfflineIndicator() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const count = await countPendingAttempts().catch(() => 0);
      if (!cancelled) setPending(count);
    };
    refresh();
    const interval = setInterval(refresh, 4000);

    const onOnline = () => {
      trySyncQueue()
        .catch(() => {})
        .finally(refresh);
    };
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (pending === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-md">
      <div className="h-6 w-6 shrink-0">
        <Cloud />
      </div>
      <span className="font-nunito">{vi.offline.savingLocally}</span>
    </div>
  );
}
