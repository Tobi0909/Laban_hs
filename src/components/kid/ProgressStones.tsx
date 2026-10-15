import { clsx } from "@/lib/clsx";

export interface ProgressStonesProps {
  total: number;
  current: number;
  className?: string;
}

/** Thanh tiến trình phiên học = các viên đá nhỏ — không số, không phần trăm. */
export function ProgressStones({ total, current, className }: ProgressStonesProps) {
  return (
    <div className={clsx("flex items-center justify-center gap-2", className)} role="img" aria-label={`Bước ${current} trên ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <span
            key={i}
            className={clsx(
              "block h-4 w-4 rounded-full border-2 transition-colors",
              done && "border-leaf bg-leaf",
              isCurrent && !done && "border-sun bg-sun",
              !done && !isCurrent && "border-border bg-card",
            )}
          />
        );
      })}
    </div>
  );
}
