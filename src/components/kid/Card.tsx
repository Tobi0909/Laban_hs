import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "@/lib/clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Thẻ trắng bo góc, viền nâu nhạt — khối nền cho nội dung trên các màn học. */
export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[24px] border border-border bg-card p-6 shadow-[0_4px_0_0_var(--color-border)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
