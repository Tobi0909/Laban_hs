"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "@/lib/clsx";

// Chữ luôn dùng text-ink (không phải text-white): các màu nền dạng pastel
// (sky/leaf/coral/lavender) không đạt tỉ lệ tương phản AA (4.5:1) với chữ
// trắng, trong khi ink đạt >5:1 trên cả 5 màu.
const TONES = {
  sky: "bg-sky border-sky-deep text-ink",
  sun: "bg-sun border-[#D9A419] text-ink",
  leaf: "bg-leaf border-[#3C9A66] text-ink",
  coral: "bg-coral border-[#E06B46] text-ink",
  lavender: "bg-lavender border-[#7C5FE0] text-ink",
  paper: "bg-card border-border text-ink",
} as const;

export interface KidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: keyof typeof TONES;
  highlighted?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Nút "kẹo dẻo": bo góc lớn, viền dưới đậm tạo khối 3D, lún xuống khi nhấn.
 * Vùng chạm tối thiểu 64x64 cho học sinh.
 */
export function KidButton({
  tone = "sky",
  highlighted = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: KidButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        "group relative flex min-h-16 min-w-16 select-none flex-col items-center justify-center gap-1 rounded-[24px] border-b-[6px] px-6 py-3 font-baloo text-xl font-semibold transition-transform duration-150 active:translate-y-1 active:border-b-[2px]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun/70",
        TONES[tone],
        highlighted && "ring-4 ring-sun ring-offset-2 ring-offset-paper",
        disabled && "cursor-not-allowed opacity-50 active:translate-y-0 active:border-b-[6px]",
        className,
      )}
      {...props}
    >
      {icon && <span className="h-10 w-10">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
